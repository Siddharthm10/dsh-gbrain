/**
 * Tests for the gbrain execution layer. The DSH subprocess service is
 * mocked (argv-capturing spawn), the embed server is mocked (fetch stub),
 * and the job lifecycle is tested against a REAL long-lived child (node
 * itself) so the state-file / liveness / SIGTERM plumbing is exercised end
 * to end without a brain.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { cliPrefix, createGbrainClient, startEmbedJob, embedJobStatus, stopEmbedJob, isAlive } from '../src/gbrain.js'

/**
 * Workspace-local temp dir: the sandbox does not guarantee /tmp across
 * processes, so tests scratch under <pkg>/.tmp (gitignored).
 */
function mkdtemp(prefix) {
  const base = join(process.cwd(), '.tmp')
  mkdirSync(base, { recursive: true })
  return mkdtempSync(join(base, prefix))
}

// ---------------------------------------------------------------------------
// cliPrefix
// ---------------------------------------------------------------------------
test('cliPrefix: explicit gbrainBin wins', () => {
  const { bun, cli } = cliPrefix({ bunBin: '/opt/bun/bin/bun', gbrainBin: '/opt/bun/bin/gbrain' })
  assert.equal(bun, '/opt/bun/bin/bun')
  assert.deepEqual(cli, ['/opt/bun/bin/bun', '/opt/bun/bin/gbrain'])
})

test('cliPrefix: derived next-to-bun path is used when it exists', () => {
  const dir = mkdtemp('dsh-gbrain-cli-')
  const bun = join(dir, 'bun')
  writeFileSync(bun, '#!/bin/sh\n')
  writeFileSync(join(dir, 'gbrain'), '#!/usr/bin/env bun\n')
  try {
    const { cli } = cliPrefix({ bunBin: bun, gbrainBin: '' })
    assert.deepEqual(cli, [bun, join(dir, 'gbrain')])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('cliPrefix: falls back to bare gbrain when the derived path is absent', () => {
  const { cli } = cliPrefix({ bunBin: '/nonexistent/bun-xyz', gbrainBin: '' })
  assert.deepEqual(cli, ['/nonexistent/bun-xyz', 'gbrain'])
})

// ---------------------------------------------------------------------------
// Fake DSH subprocess + fetch
// ---------------------------------------------------------------------------
function fakeSpawn(calls, responses = {}) {
  return (opts) => {
    calls.push(opts)
    const key = opts.argv.join(' ')
    const response = responses[key] ?? { exitCode: 0, stdout: '', stderr: '' }
    return {
      done: Promise.resolve({ exitCode: response.exitCode, signal: null }),
      collected: {
        stdout: { readFrom: () => ({ text: response.stdout }) },
        stderr: { readFrom: () => ({ text: response.stderr }) },
      },
    }
  }
}
const cfg = {
  gbrainHome: '/test/brain',
  bunBin: 'bun',
  gbrainBin: 'gbrain',
  embedServerBaseURL: 'http://127.0.0.1:8811/v1',
  embedServerAPIKey: 'key123',
  embeddingModel: 'llama-server:qwen3-embed',
  embeddingDimensions: 1024,
}

// ---------------------------------------------------------------------------
// run() argv / env / cwd
// ---------------------------------------------------------------------------
test('run: argv prefix, GBRAIN_HOME env, cwd', async () => {
  const calls = []
  const client = createGbrainClient(cfg, fakeSpawn(calls))
  await client.version()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].argv, ['bun', 'gbrain', '--version'])
  assert.equal(calls[0].env.GBRAIN_HOME, '/test/brain')
  assert.equal(calls[0].cwd, '/test/brain')
})

test('run: without a subprocess service falls back to raw node spawn', async () => {
  // Profiles without the DSH `subprocess` service (the web panel) run the
  // CLI through a raw node:child_process spawn with the same handle contract.
  const dir = mkdtemp('dsh-gbrain-raw-')
  const fake = join(dir, 'bun')
  writeFileSync(fake, '#!/bin/sh\necho fake-gbrain-version\n', { mode: 0o755 })
  try {
    const client = createGbrainClient({ ...cfg, gbrainHome: dir, bunBin: fake, gbrainBin: join(dir, 'gbrain') }, undefined)
    const result = await client.version()
    assert.equal(result.exitCode, 0)
    assert.match(result.stdout, /fake-gbrain-version/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// retrieve
// ---------------------------------------------------------------------------
test('retrieve: empty query is rejected before any spawn', async () => {
  const calls = []
  const client = createGbrainClient(cfg, fakeSpawn(calls))
  const result = await client.retrieve('   ')
  assert.equal(result.exitCode, -1)
  assert.equal(calls.length, 0)
})

test('retrieve: search mode + limit clamp', async () => {
  const calls = []
  const client = createGbrainClient(cfg, fakeSpawn(calls))
  await client.retrieve('hello world', { mode: 'search', limit: 999 })
  assert.deepEqual(calls[0].argv, ['bun', 'gbrain', 'search', 'hello world', '--limit', '50'])
})

test('retrieve: query mode', async () => {
  const calls = []
  const client = createGbrainClient(cfg, fakeSpawn(calls))
  await client.retrieve('hello', { mode: 'query', limit: 3 })
  assert.deepEqual(calls[0].argv, ['bun', 'gbrain', 'query', 'hello', '--limit', '3'])
})

// ---------------------------------------------------------------------------
// probeModels / probeDimensions (fetch stub)
// ---------------------------------------------------------------------------
test('probeModels: reachable, model listed', async () => {
  const client = createGbrainClient(cfg, null, async (url, init) => {
    assert.match(url, /\/models$/)
    assert.equal(init.headers.authorization, 'Bearer key123')
    return { ok: true, status: 200, json: async () => ({ data: [{ id: 'qwen3-embed' }, { id: 'other' }] }) }
  })
  const result = await client.probeModels()
  assert.equal(result.reachable, true)
  assert.deepEqual(result.models, ['qwen3-embed', 'other'])
  assert.equal(result.modelListed, true)
  assert.equal(result.configuredModel, 'qwen3-embed')
})

test('probeModels: network failure reports unreachable', async () => {
  const client = createGbrainClient(cfg, null, async () => {
    throw new Error('connect ECONNREFUSED')
  })
  const result = await client.probeModels()
  assert.equal(result.reachable, false)
  assert.match(result.error, /ECONNREFUSED/)
})

test('probeDimensions: match', async () => {
  const client = createGbrainClient(cfg, null, async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: [{ embedding: new Array(1024).fill(0.5) }] }),
  }))
  const result = await client.probeDimensions()
  assert.equal(result.ok, true)
  assert.equal(result.dims, 1024)
  assert.equal(result.match, true)
})

test('probeDimensions: mismatch is reported, not thrown', async () => {
  const client = createGbrainClient(cfg, null, async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: [{ embedding: new Array(512).fill(0.1) }] }),
  }))
  const result = await client.probeDimensions()
  assert.equal(result.ok, true)
  assert.equal(result.dims, 512)
  assert.equal(result.expected, 1024)
  assert.equal(result.match, false)
})

// ---------------------------------------------------------------------------
// applyEmbeddingSettings
// ---------------------------------------------------------------------------
test('applyEmbeddingSettings: config set calls + .env merge (idempotent)', async () => {
  const home = mkdtemp('dsh-gbrain-apply-')
  mkdirSync(join(home, '.gbrain'), { recursive: true })
  writeFileSync(join(home, '.gbrain', '.env'), 'OTHER_KEY=keep\n')
  const calls = []
  const client = createGbrainClient({ ...cfg, gbrainHome: home }, fakeSpawn(calls))
  try {
    const outputs = await client.applyEmbeddingSettings({
      embeddingModel: 'llama-server:qwen3-embed',
      embeddingDimensions: 1024,
      embedServerBaseURL: 'http://127.0.0.1:8811/v1',
      embedServerAPIKey: 'key123',
    })
    assert.equal(outputs.length, 3) // model + dims + base url (key goes to .env)
    assert.equal(outputs.every((o) => o.exitCode === 0), true)
    assert.deepEqual(calls[0].argv, ['bun', 'gbrain', 'config', 'set', 'embedding_model', 'llama-server:qwen3-embed'])
    assert.deepEqual(calls[1].argv, ['bun', 'gbrain', 'config', 'set', 'embedding_dimensions', '1024'])
    assert.deepEqual(calls[2].argv, ['bun', 'gbrain', 'config', 'set', 'provider_base_urls.llama-server', 'http://127.0.0.1:8811/v1'])
    const envFile = join(home, '.gbrain', '.env')
    const content = readFileSync(envFile, 'utf8')
    assert.match(content, /OTHER_KEY=keep/)
    assert.match(content, /^LLAMA_SERVER_API_KEY=key123$/m)
    assert.match(content, /^LLAMA_SERVER_BASE_URL=http:\/\/127\.0\.0\.1:8811\/v1$/m)
    // Re-apply: the key/url lines must not duplicate.
    const calls2 = []
    const client2 = createGbrainClient({ ...cfg, gbrainHome: home }, fakeSpawn(calls2))
    await client2.applyEmbeddingSettings({
      embeddingModel: 'llama-server:qwen3-embed',
      embeddingDimensions: 1024,
      embedServerBaseURL: 'http://127.0.0.1:8811/v1',
      embedServerAPIKey: 'newkey',
    })
    const again = readFileSync(envFile, 'utf8')
    assert.equal(again.split('LLAMA_SERVER_API_KEY=').length - 1, 1)
    assert.match(again, /^LLAMA_SERVER_API_KEY=newkey$/m)
    assert.equal(again.split('OTHER_KEY=keep').length - 1, 1)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Embed job lifecycle (real child, node as the "bun")
// ---------------------------------------------------------------------------
test('embed job: start -> running -> stop -> gone', async () => {
  const home = mkdtemp('dsh-gbrain-job-')
  mkdirSync(home, { recursive: true })
  const jobCfg = { ...cfg, gbrainHome: home }
  // `node -e <long-lived script> embed --stale` — node runs the -e script
  // (the trailing args are just process.argv), so the child stays alive.
  // `cli` is the full command prefix [executable, ...args]: startEmbedJob
  // appends `embed --stale` and never re-prepends bun.
  const bun = process.execPath
  const cli = [process.execPath, '-e', 'setInterval(()=>{},1000)']
  try {
    const started = startEmbedJob(jobCfg, bun, cli)
    assert.equal(started.started, true)
    assert.ok(started.pid > 0)

    await sleep(250)
    let status = embedJobStatus(jobCfg)
    assert.equal(status.running, true)
    assert.equal(status.pid, started.pid)
    assert.ok(existsSync(status.logFile))

    // A second start while running is refused.
    const second = startEmbedJob(jobCfg, bun, cli)
    assert.equal(second.started, false)
    assert.match(second.error, /already running/)

    const stop = stopEmbedJob(jobCfg)
    assert.equal(stop.stopped, true)
    await sleep(400)
    status = embedJobStatus(jobCfg)
    assert.equal(status.running, false)
  } finally {
    // Make sure nothing is left behind.
    const st = readJobStateFile(home)
    if (st && isAlive(st.pid)) { try { process.kill(st.pid, 'SIGKILL') } catch { /* gone */ } }
    rmSync(home, { recursive: true, force: true })
  }
})

test('embed job: status without any state is idle', () => {
  const home = mkdtemp('dsh-gbrain-job-empty-')
  try {
    const status = embedJobStatus({ gbrainHome: home })
    assert.deepEqual(status, { running: false })
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('isAlive: sanity', () => {
  assert.equal(isAlive(1), true) // init
  assert.equal(isAlive(-5), false)
  assert.equal(isAlive('nope'), false)
  assert.equal(isAlive(NaN), false)
})

function readJobStateFile(home) {
  try {
    return JSON.parse(readFileSync(join(home, '.gbrain', 'state', 'embed-job.json'), 'utf8'))
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
