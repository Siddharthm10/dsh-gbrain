/**
 * dsh-gbrain HTTP routes, mounted on the DSH web server.
 *
 * All routes are namespaced under /dsh-gbrain and speak JSON. The client is
 * a same-origin page (Settings -> GBrian), so plain fetch is all it needs —
 * no extra client seam. Routes are read-mostly; the write operations are
 * the ones an operator would otherwise do in a terminal:
 *
 *   GET  /dsh-gbrain/health           bun/gbrain/brain/embed-server checks
 *   GET  /dsh-gbrain/status           doctor + sources status + embed job
 *   POST /dsh-gbrain/search           {query, mode, limit} manual QC retrieval
 *   POST /dsh-gbrain/embed/start      detached `gbrain embed --stale`
 *   GET  /dsh-gbrain/embed/status     job liveness + log tail
 *   POST /dsh-gbrain/embed/stop       SIGTERM the job
 *   GET  /dsh-gbrain/probe            embed server /models + dimension probe
 *   POST /dsh-gbrain/config/apply     gbrain config set + brain .env + probe
 *   POST /dsh-gbrain/container/recreate  {device} docker stop/rm/run embed server
 *
 * @module dsh-gbrain/routes
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createGbrainClient } from './gbrain.js'

const ROUTE_PREFIX = '/dsh-gbrain'

/** Send a JSON body with a status code. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

/** Read a JSON request body (bounded). */
async function readJsonBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) return resolve({})
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Mount all gbrain routes.
 * @param ctx - the injected host context (webServer, subprocess, logger, effect).
 * @param getConfig - () => resolved config snapshot (live; the settings
 *   section updates it on change).
 * @returns the disposers registered for the routes.
 */
export function mountGbrainRoutes(ctx, getConfig) {
  const webServer = ctx.get?.('webServer') ?? ctx.webServer
  // `.bind(webServer)` is required: `register` is a class method and calling
  // the detached reference loses `this` (strict mode), so the first route
  // registration would throw `Cannot read properties of undefined
  // (reading 'exact')` inside the webserver.
  const register = webServer?.register?.bind(webServer)
  if (typeof register !== 'function') {
    ctx.logger?.warn?.('dsh-gbrain: no webServer service; routes not mounted')
    return []
  }
  const log = (message) => (ctx.get ? ctx.get('logger') : undefined)?.info?.(message)
  const disposers = []

  // Bind `spawn` to its service: it is a class method, and the DSH handle
  // contract needs the instance as `this`. When the host profile has no
  // `subprocess` service (the web panel), pass `undefined` — the client
  // falls back to a raw node child of its own.
  const subprocessService = ctx.subprocess ?? (ctx.get ? ctx.get('subprocess') : undefined)
  const client = () => createGbrainClient(getConfig(),
    subprocessService && typeof subprocessService.spawn === 'function'
      ? subprocessService.spawn.bind(subprocessService)
      : undefined)

  function on(path, handler) {
    const disposer = register({
      kind: 'exact',
      path: `${ROUTE_PREFIX}${path}`,
      handler: async (req, res) => {
        try {
          await handler(req, res)
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String(error?.message ?? error) })
        }
      },
    })
    if (typeof disposer === 'function') disposers.push(disposer)
  }

  on('/health', async (_req, res) => {
    const cfg = getConfig()
    const cli = client()
    const versionResult = await cli.version()
    // Brain presence: GBRAIN_HOME + .gbrain dir.
    let homeOk = false
    try {
      homeOk = existsSync(cfg.gbrainHome) && existsSync(join(cfg.gbrainHome, '.gbrain'))
    } catch { homeOk = false }
    const models = await cli.probeModels()
    sendJson(res, 200, {
      ok: true,
      config: {
        gbrainHome: cfg.gbrainHome,
        bunBin: cfg.bunBin,
        gbrainBin: cli.cli[1],
        embedServerBaseURL: cfg.embedServerBaseURL,
        embeddingModel: cfg.embeddingModel,
        embeddingDimensions: cfg.embeddingDimensions,
        device: cfg.device,
        containerName: cfg.containerName,
      },
      checks: {
        bun: { ok: versionResult.exitCode === 0, version: versionResult.stdout.trim() || versionResult.stderr.trim() },
        gbrainHome: { ok: homeOk },
        embedServer: models,
      },
    })
  })

  on('/status', async (_req, res) => {
    const cli = client()
    const doctor = await cli.doctor()
    const sources = await cli.sourcesStatus()
    const job = cli.embedJobStatus()
    sendJson(res, 200, {
      ok: true,
      doctor: {
        exitCode: doctor.exitCode,
        timedOut: doctor.timedOut,
        stdout: doctor.stdout,
        stderr: doctor.stderr,
      },
      sources: {
        exitCode: sources.exitCode,
        timedOut: sources.timedOut,
        stdout: sources.stdout,
        stderr: sources.stderr,
      },
      embedJob: job,
    })
  })

  on('/search', async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
    let body
    try { body = await readJsonBody(req) } catch (error) { return sendJson(res, 400, { ok: false, error: String(error?.message ?? error) }) }
    const result = await client().retrieve(body.query, { mode: body.mode, limit: body.limit })
    sendJson(res, result.exitCode === 0 ? 200 : 502, { ok: result.exitCode === 0, ...result })
  })

  on('/embed/start', async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
    const result = client().startEmbedJob()
    log(`dsh-gbrain: embed start -> ${JSON.stringify(result)}`)
    sendJson(res, result.started || result.pid ? 200 : 500, { ok: Boolean(result.started), ...result })
  })

  on('/embed/status', async (_req, res) => {
    sendJson(res, 200, { ok: true, ...client().embedJobStatus() })
  })

  on('/embed/stop', async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
    const result = client().stopEmbedJob()
    sendJson(res, result.stopped ? 200 : 500, { ok: result.stopped, ...result })
  })

  on('/probe', async (_req, res) => {
    const cli = client()
    const models = await cli.probeModels()
    const dims = models.reachable ? await cli.probeDimensions() : { ok: false, error: 'embed server unreachable' }
    sendJson(res, 200, { ok: true, models, dims })
  })

  on('/config/apply', async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
    let body
    try { body = await readJsonBody(req) } catch (error) { return sendJson(res, 400, { ok: false, error: String(error?.message ?? error) }) }
    const outputs = await client().applyEmbeddingSettings({
      embeddingModel: body.embeddingModel,
      embeddingDimensions: body.embeddingDimensions,
      embedServerBaseURL: body.embedServerBaseURL,
      embedServerAPIKey: body.embedServerAPIKey,
    })
    // Live-verify whatever we just pointed at.
    const cli2 = client()
    const models = await cli2.probeModels()
    const dims = models.reachable ? await cli2.probeDimensions() : { ok: false, error: 'embed server unreachable after apply' }
    const failed = outputs.filter((entry) => entry.exitCode !== 0)
    sendJson(res, 200, { ok: failed.length === 0 && dims.match === true, outputs, failed, models, dims })
  })

  on('/container/recreate', async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'POST only' })
    let body
    try { body = await readJsonBody(req) } catch (error) { return sendJson(res, 400, { ok: false, error: String(error?.message ?? error) }) }
    const cfg = getConfig()
    const device = body.device === 'gpu' ? 'gpu' : 'cpu'
    const ngl = device === 'gpu' ? '99' : '0'
    const spawn = ctx.subprocess?.spawn ?? ctx.get?.('subprocess')?.spawn
    const steps = []
    const docker = async (argv, { timeoutMs = 60_000, fatal = false } = {}) => {
      const result = await runRaw(spawn, ['docker', ...argv], { timeoutMs })
      steps.push({ argv: `docker ${argv.join(' ')}`, exitCode: result.exitCode, stderr: result.stderr.slice(-800) })
      if (fatal && result.exitCode !== 0) throw new Error(`docker ${argv.join(' ')} failed: ${result.stderr.slice(-400)}`)
      return result
    }
    try {
      await docker(['stop', cfg.containerName]) // idempotent; error if absent
      await docker(['rm', cfg.containerName])
      await docker([
        'run', '-d',
        '--name', cfg.containerName,
        '--restart', 'unless-stopped',
        '-p', `0.0.0.0:${cfg.containerHostPort}:8080`,
        '-v', `${String(cfg.modelHostDir).replace(/\/+$/, '')}:/models:ro`,
        cfg.containerImage,
        '--alias', modelAlias(cfg.embeddingModel),
        '--model', cfg.containerModelPath,
        '--port', '8080',
        '--host', '0.0.0.0',
        '--embeddings',
        '--ngl', ngl,
        '-c', '8192',
        '-b', '128',
        '-t', '16',
        ...(cfg.embedServerAPIKey ? ['--api-key', cfg.embedServerAPIKey] : []),
      ], { fatal: true, timeoutMs: 120_000 })
      sendJson(res, 200, { ok: true, device, ngl, steps })
    } catch (error) {
      sendJson(res, 500, { ok: false, error: String(error?.message ?? error), steps })
    }
  })

  ctx.effect?.(() => {
    for (const dispose of disposers) dispose()
  }, 'dsh-gbrain: unmount http routes')
  return disposers
}

/** llama-server `--alias`: the model id clients use (after the provider colon). */
function modelAlias(embeddingModel) {
  const id = String(embeddingModel ?? '').trim()
  const sep = id.indexOf(':')
  return sep > 0 ? id.slice(sep + 1) : id
}

/** Minimal raw spawn for docker (no DSH subprocess service required). */
async function runRaw(spawn, argv, { timeoutMs = 60_000 } = {}) {
  if (typeof spawn !== 'function') {
    return { exitCode: -1, stdout: '', stderr: 'no subprocess service (profile without the subprocess seam)' }
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('docker operation timed out')), timeoutMs)
  try {
    const handle = spawn({
      argv,
      cwd: process.cwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: 2 * 1024 * 1024 }, stderr: { maxBytes: 2 * 1024 * 1024 } },
      graceMs: 10_000,
      signal: controller.signal,
    })
    const outcome = await handle.done
    return {
      exitCode: outcome.exitCode,
      stdout: handle.collected.stdout?.readFrom(0).text ?? '',
      stderr: handle.collected.stderr?.readFrom(0).text ?? '',
    }
  } catch (error) {
    return { exitCode: -1, stdout: '', stderr: String(error?.message ?? error) }
  } finally {
    clearTimeout(timer)
  }
}
