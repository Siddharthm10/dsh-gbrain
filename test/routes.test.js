/**
 * Tests for the HTTP routes: the webServer seam is mocked (handlers are
 * captured by path), the subprocess seam is mocked, and requests/responses
 * are small fakes. No real gbrain, no real docker, no real embed server.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { mkdirSync, rmSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { mountGbrainRoutes } from '../src/routes.js'

const PREFIX = '/dsh-gbrain'

/** Workspace-local temp (the sandbox does not guarantee /tmp). */
function mkdtemp(prefix) {
  const base = join(process.cwd(), '.tmp')
  mkdirSync(base, { recursive: true })
  return mkdtempSync(join(base, prefix))
}

function jsonBody(obj) {
  return Buffer.from(JSON.stringify(obj))
}

/** Fake request: a readable stream with the given method + body. */
function makeReq(method, body) {
  const req = new Readable({ read() {} })
  req.method = method
  req.destroy = () => req.push(null)
  if (body) req.push(body)
  req.push(null)
  return req
}

/** Fake response: captures the status code + JSON body. */
function makeRes() {
  const res = {
    statusCode: null,
    headers: null,
    body: null,
    json: null,
    writeHead(code, headers) {
      this.statusCode = code
      this.headers = headers
    },
    end(body) {
      this.body = body
      try { this.json = body ? JSON.parse(body) : null } catch { /* not json */ }
    },
  }
  return res
}

const CFG = {
  gbrainHome: '/test/brain',
  bunBin: 'bun',
  gbrainBin: 'gbrain',
  embedServerBaseURL: 'http://127.0.0.1:8811/v1',
  embedServerAPIKey: '',
  embeddingModel: 'llama-server:qwen3-embed',
  embeddingDimensions: 1024,
  containerName: 'gbrain-embed',
  containerImage: 'ghcr.io/ggml-org/llama.cpp:server-cuda',
  containerModelPath: '/models/Qwen3-Embedding-0.6B-Q8_0.gguf',
  modelHostDir: '/srv/models',
  containerHostPort: 8811,
  device: 'cpu',
}

function mount({ spawnImpl, getConfig = () => CFG } = {}) {
  const spawn = spawnImpl ?? (() => { throw new Error('spawn not expected') })
  const handlers = {}
  const ctx = {
    logger: { info() {}, warn() {} },
    effect() {},
    get: (key) => ctx[key],
    subprocess: { spawn },
    webServer: { register: (route) => { handlers[route.path] = route.handler; return () => {} } },
  }
  mountGbrainRoutes(ctx, getConfig)
  return { handlers }
}

const DOCTOR_JSON = JSON.stringify({ status: 'ok', health_score: 97, checks: [] })
const SOURCES_JSON = JSON.stringify({ schema_version: 1, sources: [{ source_id: 'ws-1', name: 'workspace', total_pages: 10, total_chunks: 100, embedded_chunks: 100, embed_coverage_pct: 100 }] })

/** Key = the FULL argv joined — the mock answers per exact command. */
function spawnByArgv(map) {
  return (opts) => {
    const key = opts.argv.join(' ')
    const entry = map[key] ?? { exitCode: 0, stdout: '', stderr: '' }
    return {
      done: Promise.resolve({ exitCode: entry.exitCode, signal: null }),
      collected: {
        stdout: { readFrom: () => ({ text: entry.stdout }) },
        stderr: { readFrom: () => ({ text: entry.stderr }) },
      },
    }
  }
}

// ---------------------------------------------------------------------------
test('mount: registers all nine routes under the prefix', () => {
  const { handlers } = mount()
  const expected = ['/health', '/status', '/search', '/embed/start', '/embed/status', '/embed/stop', '/probe', '/config/apply', '/container/recreate']
  for (const path of expected) assert.equal(typeof handlers[`${PREFIX}${path}`], 'function', `missing ${path}`)
})

test('GET /health: passes through version + home + probe', async () => {
  const { handlers } = mount({
    spawnImpl: spawnByArgv({
      'bun gbrain --version': { exitCode: 0, stdout: '0.48.3.0' },
    }),
  })
  // fetch stub: unreachable server is fine, the route must still 200.
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('ECONNREFUSED') }
  try {
    const res = makeRes()
    await handlers[`${PREFIX}/health`](makeReq('GET'), res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.json.ok, true)
    assert.equal(res.json.checks.bun.ok, true)
    assert.equal(res.json.checks.bun.version, '0.48.3.0')
    assert.equal(res.json.checks.gbrainHome.ok, false) // /test/brain does not exist
    assert.equal(res.json.checks.embedServer.reachable, false)
  } finally {
    globalThis.fetch = realFetch
  }
})

test('GET /status: doctor + sources + idle job', async () => {
  const home = mkdtemp('dsh-gbrain-rt-')
  mkdirSync(join(home, '.gbrain'), { recursive: true })
  const { handlers } = mount({
    spawnImpl: spawnByArgv({
      'bun gbrain doctor --json': { exitCode: 0, stdout: DOCTOR_JSON },
      'bun gbrain sources status --json': { exitCode: 0, stdout: SOURCES_JSON },
    }),
    getConfig: () => ({ ...CFG, gbrainHome: home }),
  })
  try {
    const res = makeRes()
    await handlers[`${PREFIX}/status`](makeReq('GET'), res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.json.doctor.exitCode, 0)
    assert.equal(JSON.parse(res.json.doctor.stdout).health_score, 97)
    assert.equal(JSON.parse(res.json.sources.stdout).sources[0].embed_coverage_pct, 100)
    assert.equal(res.json.embedJob.running, false)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('POST /search: 200 on exit 0, 502 on CLI failure', async () => {
  const ok = mount({ spawnImpl: spawnByArgv({ 'bun gbrain search hello --limit 5': { exitCode: 0, stdout: 'result A\nresult B' } }) })
  let res = makeRes()
  await ok.handlers[`${PREFIX}/search`](makeReq('POST', jsonBody({ query: 'hello', mode: 'search', limit: 5 })), res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.json.ok, true)
  assert.match(res.json.stdout, /result A/)

  const bad = mount({ spawnImpl: spawnByArgv({ 'bun gbrain search hello --limit 10': { exitCode: 1, stderr: 'no such query' } }) })
  res = makeRes()
  await bad.handlers[`${PREFIX}/search`](makeReq('POST', jsonBody({ query: 'hello' })), res)
  assert.equal(res.statusCode, 502)
  assert.equal(res.json.ok, false)

  // GET is 405.
  res = makeRes()
  await ok.handlers[`${PREFIX}/search`](makeReq('GET'), res)
  assert.equal(res.statusCode, 405)

  // Malformed JSON is 400, not 500.
  res = makeRes()
  await ok.handlers[`${PREFIX}/search`](makeReq('POST', Buffer.from('{nope')), res)
  assert.equal(res.statusCode, 400)
  assert.match(res.json.error, /invalid JSON body/)
})

test('POST /search: empty query yields a clean 502 with stderr', async () => {
  const { handlers } = mount()
  const res = makeRes()
  await handlers[`${PREFIX}/search`](makeReq('POST', jsonBody({ query: '' })), res)
  assert.equal(res.statusCode, 502)
  assert.equal(res.json.ok, false)
})

test('GET /embed/status: idle without state', async () => {
  const home = mkdtemp('dsh-gbrain-rt2-')
  try {
    const { handlers } = mount({ getConfig: () => ({ ...CFG, gbrainHome: home }) })
    const res = makeRes()
    await handlers[`${PREFIX}/embed/status`](makeReq('GET'), res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.json.running, false)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('POST /container/recreate: cpu -> -ngl 0, correct mount + port', async () => {
  const seen = []
  const spawnImpl = (opts) => {
    seen.push(opts.argv)
    return {
      done: Promise.resolve({ exitCode: 0, signal: null }),
      collected: {
        stdout: { readFrom: () => ({ text: '' }) },
        stderr: { readFrom: () => ({ text: '' }) },
      },
    }
  }
  const { handlers } = mount({ spawnImpl })
  const res = makeRes()
  await handlers[`${PREFIX}/container/recreate`](makeReq('POST', jsonBody({ device: 'cpu' })), res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.json.ok, true)
  assert.equal(res.json.ngl, '0')
  assert.equal(seen.length, 3) // stop, rm, run
  assert.deepEqual(seen[0], ['docker', 'stop', 'gbrain-embed'])
  assert.deepEqual(seen[1], ['docker', 'rm', 'gbrain-embed'])
  const run = seen[2]
  assert.equal(run[0], 'docker')
  assert.equal(run[1], 'run')
  const mountIdx = run.indexOf('-v')
  assert.equal(run[mountIdx + 1], '/srv/models:/models:ro')
  const portIdx = run.indexOf('-p')
  assert.equal(run[portIdx + 1], '0.0.0.0:8811:8080')
  const nglIdx = run.indexOf('--ngl')
  assert.equal(run[nglIdx + 1], '0')
  assert.equal(run.indexOf('--gpus'), -1) // cpu mode: no GPU passthrough
  const cIdx = run.indexOf('-c')
  assert.equal(run[cIdx + 1], '16384') // slot ctx = 16384/4 = 4096 (verified recipe)
  const npIdx = run.indexOf('-np')
  assert.equal(run[npIdx + 1], '4')
  const sleepIdx = run.indexOf('--sleep-idle-seconds')
  assert.equal(run[sleepIdx + 1], '300')
})

test('POST /container/recreate: gpu -> -ngl 99; fatal run failure -> 500 with steps', async () => {
  let callCount = 0
  const seen = []
  const spawnImpl = (opts) => {
    callCount += 1
    seen.push(opts.argv)
    const failed = opts.argv.includes('run')
    return {
      done: Promise.resolve({ exitCode: failed ? 1 : 0, signal: null }),
      collected: {
        stdout: { readFrom: () => ({ text: '' }) },
        stderr: { readFrom: () => ({ text: failed ? 'no such image' : '' }) },
      },
    }
  }
  const { handlers } = mount({ spawnImpl })
  const res = makeRes()
  await handlers[`${PREFIX}/container/recreate`](makeReq('POST', jsonBody({ device: 'gpu' })), res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.json.ok, false)
  assert.match(res.json.error, /docker run .* failed/)
  assert.equal(res.json.steps.length, 3)
  // gpu mode passes --gpus all and the verified recipe
  const run = seen[seen.length - 1]
  const gpusIdx = run.indexOf('--gpus')
  assert.equal(run[gpusIdx + 1], 'all')
  const nglIdx = run.indexOf('--ngl')
  assert.equal(run[nglIdx + 1], '99')
  void callCount
})
