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
 * Service seams: `settings`, `webServer`, and `subprocess` are all used when
 * present — each through its own scoped injection — so a profile missing any
 * of them degrades gracefully instead of failing to load. The settings
 * section is registered via `installSettingsSection`, which injects the
 * `settings` seam itself; there is no hard dependency.
 *
 * dsh-harness rc2-compat host: uses `installSettingsSection` from
 * `@deepseek-ai/dsh-settings` (the rc.2 stock-plugin pattern) instead of the
 * removed `settings.installSection` service method.
 *
 * @module dsh-gbrain
 */
import { resolveConfig } from './config.js'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { NS, sectionSchema, validateSection } from './settings-section.js'
import { mountGbrainRoutes } from './routes.js'

/** Plugin name (the loader-facing id is the package name, `dsh-gbrain`). */
export const name = 'gbrain'

/**
 * No hard dependencies: the settings section rides `installSettingsSection`
 * (which injects the `settings` seam on its own scoped fiber) and the HTTP
 * routes check for `webServer` — so a profile without either seam still
 * loads instead of parking on a missing service.
 */
export const inject = []

/**
 * @param ctx - the plugin context.
 * @param config - the patch-row config (cordis.patch.yml), may be anything.
 */
export function apply(ctx, config) {
  // Fully resolved base row: patch-row values > env vars > built-in
  // defaults. Reads without a settings layer resolve to this as-is, and a
  // settings layer that clears a field falls back through the same layers
  // again on the next read.
  const base = resolveConfig(config)
  let current = base
  // `getConfig` returns a FRESH resolved snapshot each call: when `current`
  // is the live settings source function it re-resolves the latest saved
  // values (so a field cleared in the tab can fall through to env/defaults);
  // otherwise it re-resolves the base row (idempotent).
  const getConfig = () => resolveConfig(typeof current === 'function' ? current() : current, undefined)

  // Settings section: persisted operator config. The live resolver follows
  // it so a saved change (e.g. a new gbrainHome) applies to the next route
  // call without a restart.
  //
  // dsh-harness rc2-compat host: the rc.2 hook contract — `setSource`
  // receives a thunk returning the resolved scope value, `validate` receives
  // the fully resolved candidate and must THROW to reject the write, and
  // `onChange` takes no arguments (re-read the live config instead).
  installSettingsSection(ctx, NS, sectionSchema(), base, {
    setSource: (source) => {
      if (typeof source === 'function') {
        current = source
      } else if (source && typeof source === 'object') {
        current = source
      }
    },
    validate: (value) => {
      const problem = validateSection(value, getConfig())
      if (problem !== null) throw new Error(problem)
    },
    onChange: () => {
      const live = getConfig()
      ctx.logger?.info?.(`dsh-gbrain: settings changed (gbrainHome=${live.gbrainHome}, model=${live.embeddingModel})`)
    },
  })

  // HTTP routes for the settings-tab UI.
  ctx.inject(['webServer'], (hostCtx) => {
    hostCtx.effect(
      () => {
        // A thrown mount failure would otherwise be swallowed by the effect
        // machinery (logged only inside the tree), leaving the panel 404ing
        // silently — surface it on the daemon console instead.
        try {
          return mountGbrainRoutes({ ...hostCtx, get: (key) => (hostCtx.get ? hostCtx.get(key) : hostCtx[key]) }, getConfig)
        } catch (error) {
          console.error('[dsh-gbrain] failed to mount http routes:', error)
          throw error
        }
      },
      'dsh-gbrain: http routes',
    )
  })
}
