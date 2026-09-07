/**
 * dsh-gbrain configuration resolution.
 *
 * Precedence per field: patch row (the cordis.patch.yml default, passed as
 * `config` by the loader) > `DSH_GCBRAIN_*` environment variable > built-in
 * default. `gbrainHome` additionally falls back to the `GBRAIN_HOME`
 * environment variable (the same variable the gbrain CLI itself honors) and
 * then to `~/.gbrain`, so a brain that already lives in a standard place
 * needs no configuration at all — the panel's whole point is that an
 * existing brain on the server is a first-class target.
 *
 * @module dsh-gbrain/config
 */
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Built-in defaults; the patch row in cordis.patch.yml mirrors these. */
export const DEFAULTS = Object.freeze({
  /** Brain root (GBRAIN_HOME). Empty = use $GBRAIN_HOME, then ~/.gbrain. */
  gbrainHome: '',
  /** Bun binary that executes the gbrain CLI (its shebang is `env bun`). */
  bunBin: 'bun',
  /**
   * gbrain bin path. Empty = resolve `gbrain` from PATH / the bun global
   * bin dir next to `bunBin`; set it explicitly when the bun global bin dir
   * is not on PATH.
   */
  gbrainBin: '',
  /** OpenAI-compatible base URL of the embedding server (llama-server). */
  embedServerBaseURL: 'http://127.0.0.1:8811/v1',
  /** Bearer key for the embedding server (also written into the brain .env). */
  embedServerAPIKey: '',
  /** gbrain `embedding_model` value, any `provider:model` gbrain accepts. */
  embeddingModel: 'llama-server:qwen3-embed',
  /** Hard 1024 on the production brain (PGLite cannot alter vector dims). */
  embeddingDimensions: 1024,
  /** Docker container name of the embedding server (device toggle target). */
  containerName: 'gbrain-embed',
  /** Embedding server image. */
  containerImage: 'ghcr.io/ggml-org/llama.cpp:server-cuda',
  /** Model file path as mounted inside the container. */
  containerModelPath: '/models/Qwen3-Embedding-0.6B-Q8_0.gguf',
  /** Host directory holding the model files, mounted read-only as /models. */
  modelHostDir: '/home/siddharthm10/models/llama-cache',
  /** Host port the embedding server is published on (uncommon by design). */
  containerHostPort: 8811,
  /** Embed container device: cpu (-ngl 0) or gpu (-ngl 99). */
  device: 'cpu',
})

/** Environment-variable overrides, one per field (DSH_GCBRAIN_ prefix). */
const ENV_KEYS = Object.freeze({
  gbrainHome: 'DSH_GCBRAIN_HOME',
  bunBin: 'DSH_GCBRAIN_BUN_BIN',
  gbrainBin: 'DSH_GCBRAIN_BIN',
  embedServerBaseURL: 'DSH_GCBRAIN_EMBED_URL',
  embedServerAPIKey: 'DSH_GCBRAIN_EMBED_KEY',
  embeddingModel: 'DSH_GCBRAIN_EMBED_MODEL',
  embeddingDimensions: 'DSH_GCBRAIN_EMBED_DIMS',
  containerName: 'DSH_GCBRAIN_CONTAINER',
  containerImage: 'DSH_GCBRAIN_CONTAINER_IMAGE',
  containerModelPath: 'DSH_GCBRAIN_CONTAINER_MODEL',
  modelHostDir: 'DSH_GCBRAIN_MODEL_HOST_DIR',
  containerHostPort: 'DSH_GCBRAIN_CONTAINER_PORT',
  device: 'DSH_GCBRAIN_DEVICE',
})

/**
 * Read one non-empty string setting across the layers. Empty or
 * whitespace-only values count as unset (an operator clearing a field in
 * the settings tab must be able to fall through, not pin an empty string).
 * @param value - patch-row value.
 * @param envValue - environment value.
 * @param fallback - built-in default.
 * @returns the resolved string, or the fallback when every layer is empty.
 */
export function stringSetting(value, envValue, fallback) {
  for (const candidate of [value, envValue]) {
    if (typeof candidate === 'string' && candidate.trim() !== '') return candidate.trim()
  }
  return fallback
}

/**
 * Read one positive-integer setting across the layers; non-numeric or
 * non-positive values fall through (a half-typed settings field must never
 * poison a CLI flag).
 * @param value - patch-row value.
 * @param envValue - environment value.
 * @param fallback - built-in default.
 * @returns the resolved integer.
 */
export function numberSetting(value, envValue, fallback) {
  for (const candidate of [value, envValue]) {
    const parsed = typeof candidate === 'number' ? candidate : Number(candidate)
    if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return fallback
}

/**
 * Resolve the full configuration.
 * @param config - patch-row config from the loader (may be anything).
 * @param env - environment map (defaults to process.env).
 * @returns the resolved configuration object.
 */
export function resolveConfig(config = {}, env = process.env) {
  const row = typeof config === 'object' && config !== null ? config : {}
  const resolved = {
    gbrainHome: stringSetting(row.gbrainHome, env[ENV_KEYS.gbrainHome], DEFAULTS.gbrainHome),
    bunBin: stringSetting(row.bunBin, env[ENV_KEYS.bunBin], DEFAULTS.bunBin),
    gbrainBin: stringSetting(row.gbrainBin, env[ENV_KEYS.gbrainBin], DEFAULTS.gbrainBin),
    embedServerBaseURL: stringSetting(row.embedServerBaseURL, env[ENV_KEYS.embedServerBaseURL], DEFAULTS.embedServerBaseURL),
    embedServerAPIKey: stringSetting(row.embedServerAPIKey, env[ENV_KEYS.embedServerAPIKey], DEFAULTS.embedServerAPIKey),
    embeddingModel: stringSetting(row.embeddingModel, env[ENV_KEYS.embeddingModel], DEFAULTS.embeddingModel),
    embeddingDimensions: numberSetting(row.embeddingDimensions, env[ENV_KEYS.embeddingDimensions], DEFAULTS.embeddingDimensions),
    containerName: stringSetting(row.containerName, env[ENV_KEYS.containerName], DEFAULTS.containerName),
    containerImage: stringSetting(row.containerImage, env[ENV_KEYS.containerImage], DEFAULTS.containerImage),
    containerModelPath: stringSetting(row.containerModelPath, env[ENV_KEYS.containerModelPath], DEFAULTS.containerModelPath),
    modelHostDir: stringSetting(row.modelHostDir, env[ENV_KEYS.modelHostDir], DEFAULTS.modelHostDir),
    containerHostPort: numberSetting(row.containerHostPort, env[ENV_KEYS.containerHostPort], DEFAULTS.containerHostPort),
    device: stringSetting(row.device, env[ENV_KEYS.device], DEFAULTS.device) === 'gpu' ? 'gpu' : 'cpu',
  }
  // gbrainHome final resolution: explicit config wins; otherwise the
  // GBRAIN_HOME env var the CLI itself reads; otherwise ~/.gbrain.
  if (resolved.gbrainHome === '') {
    resolved.gbrainHome =
      (typeof env.GBRAIN_HOME === 'string' && env.GBRAIN_HOME.trim() !== '' && env.GBRAIN_HOME.trim()) ||
      join(homedir(env.HOME), '.gbrain')
  }
  return resolved
}

/**
 * Split `provider:model` into its parts. gbrain's embedding model ids are
 * `provider:model` (provider `llama-server`, `voyage`, …); a bare model id
 * without a colon is treated as `llama-server:<id>` (the local default) so
 * the settings tab accepts the short form.
 * @param embeddingModel - the configured model id.
 * @returns {provider, model}.
 */
export function splitEmbeddingModel(embeddingModel) {
  const id = String(embeddingModel ?? '').trim()
  if (id === '') return { provider: '', model: '' }
  const sep = id.indexOf(':')
  if (sep > 0) return { provider: id.slice(0, sep), model: id.slice(sep + 1) }
  return { provider: 'llama-server', model: id }
}
