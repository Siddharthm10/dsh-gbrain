/**
 * dsh-gbrain — the server half.
 *
 * A control panel for a gbrain brain running on this machine (or pointed at
 * an existing brain anywhere the host user can reach). The plugin deliberately
 * registers NO agent tools and NO LLM adapter: the brain's contract for
 * agents is the gbrain CLI itself (bash), and the panel exists for the human
 * operator — health and per-source status, a manual search/query box for
 * quality-checking retrieval, a configurable embedding model (any
 * `provider:model`, base URL and key, applied live through `gbrain config`
 * and the brain's `.env`), an embed-now job with a progress log, and a
 * CPU/GPU toggle for the embedding container.
 *
 * Service seams: `settings` is a hard dependency (every profile mounts a
 * settings provider); `webServer` and `subprocess` are used when present, so
 * a headless profile degrades gracefully instead of failing to load.
 *
 * @module dsh-gbrain
 */
import { resolveConfig } from './config.js'
import { NS, sectionSchema, validateSection } from './settings-section.js'
import { mountGbrainRoutes } from './routes.js'

/** Plugin name (the loader-facing id is the package name, `dsh-gbrain`). */
export const name = 'gbrain'

/** Hard dependencies: the settings provider (present on every profile). */
export const inject = ['settings']

/**
 * @param ctx - the plugin context.
 * @param config - the patch-row config (cordis.patch.yml), may be anything.
 */
export function apply(ctx, config) {
  let current = resolveConfig(config)

  // Settings section: persisted operator config; the live resolver follows
  // it so a saved change (e.g. a new gbrainHome) applies to the next route
  // call without a restart.
  ctx.inject(['settings'], (sctx) => {
    sctx.settings.installSection(ctx, NS, sectionSchema(), current, {
      setSource: (source) => {
        if (typeof source === 'function') {
          current = source
        } else if (source && typeof source === 'object') {
          current = source
        }
      },
      validate: (value) => validateSection(value, current),
      onChange: (value) => {
        if (value && typeof value === 'object') {
          current = resolveConfig(value, current)
          ctx.logger?.info?.(`dsh-gbrain: settings changed (gbrainHome=${current.gbrainHome}, model=${current.embeddingModel})`)
        }
      },
    })
  })

  // HTTP routes for the settings-tab UI. `getConfig` returns a FRESH
  // resolved snapshot each call: when `current` is a live source function
  // the settings layer has updated it; otherwise we re-resolve the last
  // persisted value.
  const getConfig = () => (typeof current === 'function' ? resolveConfig(current(), undefined) : current)
  ctx.inject(['webServer'], (hostCtx) => {
    hostCtx.effect(
      () => mountGbrainRoutes({ ...hostCtx, get: (key) => (hostCtx.get ? hostCtx.get(key) : hostCtx[key]) }, getConfig),
      'dsh-gbrain: http routes',
    )
  })
}
