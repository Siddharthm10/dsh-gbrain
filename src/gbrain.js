/**
 * The gbrain execution layer: everything the panel does on the host side.
 *
 * Contract: the gbrain CLI (invoked through bun, because its bin shebang is
 * `#!/usr/bin/env bun`) is the ONLY way this plugin talks to a brain. The
 * panel never opens the PGLite database itself and never parses the brain's
 * files — it runs `gbrain …` with GBRAIN_HOME pointed at the configured
 * brain and reads stdout. That keeps the plugin correct across gbrain
 * versions and keeps the brain's own tooling (doctor, sync, embed)
 * authoritative.
 *
 * Two execution paths, deliberately different:
 *   - short-lived reads (status / doctor / search / config / probe) run
 *     through the DSH `subprocess` service with a hard timeout;
 *   - the long `embed --stale` job is a detached node child (it can outlive
 *     any request and any fiber), writing to a log file under the brain,
 *     with a small state file so status survives a web restart.
 *
 * @module dsh-gbrain/gbrain
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync, openSync, closeSync } from 'node:fs'
import { join, dirname } from 'node:path'

const COLLECT_BYTES = 4 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 120_000
/** doctor can walk the whole brain; give it more. */
const DOCTOR_TIMEOUT_MS = 300_000
/** Search is cheap but the embed server can be busy; still bounded. */
const SEARCH_TIMEOUT_MS = 180_000

/**
 * Build the CLI argv prefix: [bunBin, gbrainBin]. The gbrain bin is resolved
 * from config, or derived next to the bun bin (a bun global install puts
 * `gbrain` in the same bin dir as `bun`), or left as `gbrain` for PATH
 * resolution by bun itself.
 * @param cfg - resolved config.
 * @returns {bun: string, cli: string[]}.
 */
export function cliPrefix(cfg) {
  const bun = String(cfg.bunBin || 'bun')
  let cli = String(cfg.gbrainBin || '').trim()
  if (cli === '') {
    // Derived candidate: the bun global bin dir usually holds gbrain.
    cli = join(dirname(bun), 'gbrain')
    // If the derived path does not exist, fall back to bare `gbrain`
    // (bun resolves it against its own global bin dir + PATH).
    try {
      if (!existsSync(cli)) cli = 'gbrain'
    } catch {
      cli = 'gbrain'
    }
  }
  return { bun, cli: [bun, cli] }
}

/**
 * Create a gbrain client bound to a config snapshot and a DSH subprocess
 * spawn function.
 * @param cfg - resolved config.
 * @param spawnFn - `ctx.subprocess.spawn` (argv-array, no shell).
 * @param fetchImpl - fetch implementation (defaults to global fetch).
 * @returns the client object.
 */
export function createGbrainClient(cfg, spawnFn, fetchImpl = fetch) {
  const { bun, cli } = cliPrefix(cfg)
  const env = () => ({ GBRAIN_HOME: cfg.gbrainHome })

  /**
   * Run one gbrain command to completion and capture output.
   * @param cmd - gbrain command argv (without the bun/cli prefix).
   * @param options - {timeoutMs}.
   * @returns {exitCode, stdout, stderr, timedOut}.
   */
  async function run(cmd, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (typeof spawnFn !== 'function') {
      return { exitCode: -1, stdout: '', stderr: 'no subprocess service (profile without the subprocess seam)', timedOut: false }
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new Error('gbrain operation timed out')), timeoutMs)
    let handle
    try {
      handle = spawnFn({
        argv: [...cli, ...cmd],
        cwd: cfg.gbrainHome,
        env: env(),
        stdio: {
          stdin: 'ignore',
          stdout: { maxBytes: COLLECT_BYTES },
          stderr: { maxBytes: COLLECT_BYTES },
        },
        graceMs: 15_000,
        signal: controller.signal,
      })
      const outcome = await handle.done
      return {
        exitCode: outcome.exitCode,
        stdout: handle.collected.stdout?.readFrom(0).text ?? '',
        stderr: handle.collected.stderr?.readFrom(0).text ?? '',
        timedOut: false,
      }
    } catch (error) {
      return {
        exitCode: -1,
        stdout: '',
        stderr: String(error?.message ?? error),
        timedOut: controller.signal.aborted,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  /** `gbrain --version` — the cheapest proof the CLI runs at all. */
  const version = () => run(['--version'], { timeoutMs: 30_000 })

  /** `gbrain doctor --json` — the brain's own health report. */
  const doctor = () => run(['doctor', '--json'], { timeoutMs: DOCTOR_TIMEOUT_MS })

  /** `gbrain sources status --json` — per-source sync/embed dashboard. */
  const sourcesStatus = () => run(['sources', 'status', '--json'], { timeoutMs: DEFAULT_TIMEOUT_MS })

  /**
   * Manual retrieval for quality checking. `mode: 'search'` is the cheap
   * hybrid (no LLM expansion); `mode: 'query'` adds multi-query expansion.
   * The raw CLI text is returned verbatim — this is a QC box, and the user
   * should see exactly what the CLI shows.
   */
  async function retrieve(text, { mode = 'search', limit = 10 } = {}) {
    const clean = String(text ?? '').trim()
    if (clean === '') return { exitCode: -1, stdout: '', stderr: 'empty query', timedOut: false }
    const lim = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 10
    const cmd = mode === 'query' ? ['query', clean, '--limit', String(lim)] : ['search', clean, '--limit', String(lim)]
    return run(cmd, { timeoutMs: SEARCH_TIMEOUT_MS })
  }

  /**
   * Apply embedding-model settings to the brain: `gbrain config set` for
   * model + dimensions + provider base URL, and the brain's documented
   * secrets file ($GBRAIN_HOME/.gbrain/.env) for the key. Returns the raw
   * outputs for the UI to surface.
   */
  async function applyEmbeddingSettings({ embeddingModel, embeddingDimensions, embedServerBaseURL, embedServerAPIKey }) {
    const outputs = []
    if (embeddingModel) {
      outputs.push(await run(['config', 'set', 'embedding_model', String(embeddingModel).trim()]))
    }
    if (embeddingDimensions) {
      outputs.push(await run(['config', 'set', 'embedding_dimensions', String(Math.floor(Number(embeddingDimensions)))]))
    }
    const base = String(embedServerBaseURL ?? '').trim()
    if (base) {
      const { provider } = splitModel(embeddingModel ?? 'llama-server:x')
      outputs.push(await run(['config', 'set', `provider_base_urls.${provider}`, base]))
    }
    if (embedServerAPIKey !== undefined) {
      const envFile = join(cfg.gbrainHome, '.gbrain', '.env')
      try {
        mkdirSync(dirname(envFile), { recursive: true })
        const key = String(embedServerAPIKey)
        const lines = readEnvFile(envFile)
        const keyLine = `LLAMA_SERVER_API_KEY=${key}`
        const urlLine = `LLAMA_SERVER_BASE_URL=${base || ''}`
        const next = []
        let touchedKey = false
        let touchedUrl = false
        for (const line of lines) {
          if (line.startsWith('LLAMA_SERVER_API_KEY=')) {
            if (key !== '') { next.push(keyLine); touchedKey = true }
            continue
          }
          if (line.startsWith('LLAMA_SERVER_BASE_URL=')) {
            if (base !== '') { next.push(urlLine); touchedUrl = true }
            continue
          }
          next.push(line)
        }
        if (!touchedKey && key !== '') next.push(keyLine)
        if (!touchedUrl && base !== '') next.push(urlLine)
        writeFileSync(envFile, next.join('\n') + (next.length > 0 ? '\n' : ''), { mode: 0o600 })
      } catch (error) {
        outputs.push({ exitCode: -1, stdout: '', stderr: `failed to write ${envFile}: ${String(error?.message ?? error)}`, timedOut: false })
      }
    }
    return outputs
  }

  /**
   * Probe the embedding server: GET <base>/models with the configured
   * bearer key. Reports reachability, the listed model ids, and whether the
   * configured model is among them.
   */
  async function probeModels() {
    const base = String(cfg.embedServerBaseURL || '').replace(/\/+$/, '')
    if (base === '' || base === 'http' || base === 'https') return { reachable: false, error: 'no base URL configured' }
    try {
      const headers = {}
      if (cfg.embedServerAPIKey) headers.authorization = `Bearer ${cfg.embedServerAPIKey}`
      const response = await fetchImpl(`${base}/models`, { headers, signal: AbortSignal.timeout(10_000) })
      if (!response.ok) return { reachable: false, status: response.status, error: `HTTP ${response.status}` }
      const body = await response.json()
      const ids = (body?.data ?? []).map((entry) => entry?.id).filter(Boolean)
      const { model } = splitModel(cfg.embeddingModel)
      return { reachable: true, status: response.status, models: ids, configuredModel: model, modelListed: ids.includes(model) }
    } catch (error) {
      return { reachable: false, error: String(error?.cause?.code ?? error?.message ?? error) }
    }
  }

  /**
   * Dimension probe: embed one short string and measure the vector. This is
   * the check that catches the fatal 1024-dim mismatch BEFORE any data is
   * written — a wrong-dim model against a vector(1024) schema is a full
   * wipe+reinit, so the panel verifies live.
   */
  async function probeDimensions() {
    const base = String(cfg.embedServerBaseURL || '').replace(/\/+$/, '')
    const { model } = splitModel(cfg.embeddingModel)
    if (base === '' || base === 'http' || base === 'https') return { ok: false, error: 'no base URL configured' }
    try {
      const headers = { 'content-type': 'application/json' }
      if (cfg.embedServerAPIKey) headers.authorization = `Bearer ${cfg.embedServerAPIKey}`
      const response = await fetchImpl(`${base}/embeddings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, input: 'dsh-gbrain dimension probe' }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) return { ok: false, status: response.status, error: `HTTP ${response.status}` }
      const body = await response.json()
      const vector = body?.data?.[0]?.embedding
      const dims = Array.isArray(vector) ? vector.length : null
      return { ok: dims !== null, dims, expected: cfg.embeddingDimensions, match: dims === cfg.embeddingDimensions }
    } catch (error) {
      return { ok: false, error: String(error?.cause?.code ?? error?.message ?? error) }
    }
  }

  return {
    bun,
    cli,
    env,
    run,
    version,
    doctor,
    sourcesStatus,
    retrieve,
    applyEmbeddingSettings,
    probeModels,
    probeDimensions,
    // Job management (detached, outlives requests):
    startEmbedJob: () => startEmbedJob(cfg, bun, cli),
    embedJobStatus: () => embedJobStatus(cfg),
    stopEmbedJob: () => stopEmbedJob(cfg),
  }
}

/** Split a `provider:model` id (mirrors config.js; local to avoid a cycle). */
function splitModel(embeddingModel) {
  const id = String(embeddingModel ?? '').trim()
  const sep = id.indexOf(':')
  if (sep > 0) return { provider: id.slice(0, sep), model: id.slice(sep + 1) }
  return { provider: 'llama-server', model: id }
}

function readEnvFile(file) {
  try {
    return readFileSync(file, 'utf8').split('\n')
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Embed job (detached `gbrain embed --stale`)
// ---------------------------------------------------------------------------

function stateFile(home) {
  return join(home, '.gbrain', 'state', 'embed-job.json')
}
function logFileFor(home, startedAt) {
  return join(home, '.gbrain', 'logs', `embed-${startedAt}.log`)
}

/**
 * Start a detached `gbrain embed --stale` for the configured brain.
 * Returns {started, pid, logFile, error?}. Never throws.
 */
export function startEmbedJob(cfg, bun, cli) {
  try {
    const state = readJobState(cfg)
    if (state && isAlive(state.pid)) {
      return { started: false, pid: state.pid, logFile: state.logFile, error: 'already running' }
    }
    const startedAt = String(Date.now())
    const logFile = logFileFor(cfg.gbrainHome, startedAt)
    mkdirSync(dirname(logFile), { recursive: true })
    mkdirSync(dirname(stateFile(cfg.gbrainHome)), { recursive: true })
    const out = openSync(logFile, 'a')
    const child = spawn(bun, [...cli, 'embed', '--stale'], {
      cwd: cfg.gbrainHome,
      env: { ...process.env, GBRAIN_HOME: cfg.gbrainHome },
      detached: true,
      stdio: ['ignore', out, out],
    })
    closeSync(out)
    child.unref()
    const next = { pid: child.pid, logFile, startedAt, command: `${bun} ${cli.join(' ')} embed --stale` }
    writeFileSync(stateFile(cfg.gbrainHome), JSON.stringify(next, null, 2))
    return { started: true, pid: child.pid, logFile, startedAt }
  } catch (error) {
    return { started: false, error: String(error?.message ?? error) }
  }
}

/**
 * Read the job state and liveness. Returns {running, pid, logFile, startedAt,
 * logTail} — logTail is the last ~40 lines of the job log (the embed CLI
 * prints per-batch progress there).
 */
export function embedJobStatus(cfg) {
  try {
    const state = readJobState(cfg)
    if (!state) return { running: false }
    const running = isAlive(state.pid)
    let logTail = ''
    try {
      const raw = readFileSync(state.logFile, 'utf8')
      const lines = raw.split('\n').filter((line) => line.trim() !== '')
      logTail = lines.slice(-40).join('\n')
    } catch { /* no log yet */ }
    return { running, pid: state.pid, logFile: state.logFile, startedAt: state.startedAt, command: state.command, logTail }
  } catch {
    return { running: false }
  }
}

/** Stop a running job (SIGTERM to the pid). Returns {stopped, error?}. */
export function stopEmbedJob(cfg) {
  try {
    const state = readJobState(cfg)
    if (!state) return { stopped: false, error: 'no job state' }
    if (!isAlive(state.pid)) return { stopped: false, error: 'job not running' }
    process.kill(state.pid, 'SIGTERM')
    return { stopped: true, pid: state.pid }
  } catch (error) {
    return { stopped: false, error: String(error?.message ?? error) }
  }
}

function readJobState(cfg) {
  try {
    const raw = readFileSync(stateFile(cfg.gbrainHome), 'utf8')
    const parsed = JSON.parse(raw)
    if (typeof parsed?.pid !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/** True when the pid is a live process owned by (or killable by) us. */
export function isAlive(pid) {
  if (typeof pid !== 'number' || !Number.isFinite(pid)) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM' // exists but not ours
  }
}
