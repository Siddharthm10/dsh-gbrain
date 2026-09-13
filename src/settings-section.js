/**
 * The GBrian settings section: the Settings tab's persisted namespace.
 *
 * The host registers this namespace (via `installSettingsSection` from
 * `@deepseek-ai/dsh-settings` — dsh-harness rc2-compat host) with the
 * cordis.patch.yml row as the composition base; the browser tab reads and
 * writes it through the settings client on the `connection` seam, and the
 * server half resolves the value live on every route call so a saved change
 * applies immediately — including pointing the panel at a different brain
 * (gbrainHome).
 *
 * Schema field names match `resolveConfig`'s output one-to-one.
 *
 * @module dsh-gbrain/settings-section
 */
import Schema from '@deepseek-ai/schemastery'
import { DEFAULTS } from './config.js'

/** The settings namespace this plugin owns. */
export const NS = 'gbrain'

/**
 * Build the namespace schema.
 * @returns the schemastery object schema for the section.
 */
export function sectionSchema() {
  return Schema.object({
    gbrainHome: Schema.string().default(DEFAULTS.gbrainHome),
    bunBin: Schema.string().default(DEFAULTS.bunBin),
    gbrainBin: Schema.string().default(DEFAULTS.gbrainBin),
    embedServerBaseURL: Schema.string().default(DEFAULTS.embedServerBaseURL),
    embedServerAPIKey: Schema.string().default(DEFAULTS.embedServerAPIKey),
    embeddingModel: Schema.string().default(DEFAULTS.embeddingModel),
    embeddingDimensions: Schema.number().default(DEFAULTS.embeddingDimensions),
    containerName: Schema.string().default(DEFAULTS.containerName),
    containerImage: Schema.string().default(DEFAULTS.containerImage),
    containerModelPath: Schema.string().default(DEFAULTS.containerModelPath),
    modelHostDir: Schema.string().default(DEFAULTS.modelHostDir),
    containerHostPort: Schema.number().default(DEFAULTS.containerHostPort),
    device: Schema.string().default(DEFAULTS.device),
  })
}

/**
 * Validate a settings payload before it is persisted. The one hard rule:
 * changing the embedding dimensions on an EXISTING brain is a full
 * wipe+reinit (PGLite cannot ALTER a vector column), so a dims change away
 * from the current brain's actual column is refused here with a clear
 * message instead of silently destroying the index.
 * @param value - the candidate settings value.
 * @param current - the currently persisted value (or null).
 * @returns an error string, or null when the value is acceptable.
 */
export function validateSection(value, current) {
  if (!value || typeof value !== 'object') return 'settings value must be an object'
  const dims = Number(value.embeddingDimensions)
  if (!Number.isInteger(dims) || dims <= 0 || dims > 65536) return 'embeddingDimensions must be a positive integer'
  const port = Number(value.containerHostPort)
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return 'containerHostPort must be a port (1024-65535)'
  const model = String(value.embeddingModel ?? '').trim()
  if (model === '' || model.includes(' ')) return 'embeddingModel must be a non-empty provider:model id without spaces'
  const base = String(value.embedServerBaseURL ?? '').trim()
  if (base !== '' && !/^https?:\/\//i.test(base)) return 'embedServerBaseURL must be an http(s) URL (or empty)'
  if (current && Number(current.embeddingDimensions) !== dims) {
    return (
      `embeddingDimensions changed ${Number(current.embeddingDimensions)} -> ${dims}: an existing brain cannot ` +
      'alter its vector column (PGLite). This would require wiping and re-initializing the brain ' +
      '(gbrain init --force on a fresh home). Keep the current dimensions or point gbrainHome at a new brain.'
    )
  }
  return null
}
