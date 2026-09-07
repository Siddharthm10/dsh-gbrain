/**
 * Tests for the config resolution + embedding-model parsing.
 * No network, no brain, no bun — pure functions only.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { resolveConfig, DEFAULTS, splitEmbeddingModel } from '../src/config.js'

test('defaults when nothing is configured', () => {
  const cfg = resolveConfig({}, {})
  // Empty gbrainHome resolves to the platform default brain location.
  assert.equal(cfg.gbrainHome, join(homedir(), '.gbrain'))
  assert.equal(cfg.bunBin, 'bun')
  assert.equal(cfg.gbrainBin, '')
  assert.equal(cfg.embedServerBaseURL, DEFAULTS.embedServerBaseURL)
  assert.equal(cfg.embeddingModel, 'llama-server:qwen3-embed')
  assert.equal(cfg.embeddingDimensions, 1024)
  assert.equal(cfg.device, 'cpu')
  assert.equal(cfg.containerHostPort, 8811)
})

test('config values win over env and defaults', () => {
  const cfg = resolveConfig(
    { gbrainHome: '/x/brain', embeddingModel: 'voyage:voyage-4', embeddingDimensions: 512, device: 'gpu' },
    { DSH_GCBRAIN_HOME: '/env/brain' },
  )
  assert.equal(cfg.gbrainHome, '/x/brain')
  assert.equal(cfg.embeddingModel, 'voyage:voyage-4')
  assert.equal(cfg.embeddingDimensions, 512)
  assert.equal(cfg.device, 'gpu')
})

test('GBRAIN_HOME env is honored when config.gbrainHome is empty', () => {
  const cfg = resolveConfig({}, { GBRAIN_HOME: '/env/brain' })
  assert.equal(cfg.gbrainHome, '/env/brain')
})

test('DSH_GCBRAIN_* env overrides defaults', () => {
  const cfg = resolveConfig({}, {
    DSH_GCBRAIN_BUN_BIN: '/opt/bun/bin/bun',
    DSH_GCBRAIN_EMBED_MODEL: 'llama-server:my-embed',
    DSH_GCBRAIN_EMBED_DIMS: '768',
    DSH_GCBRAIN_DEVICE: 'gpu',
    DSH_GCBRAIN_EMBED_URL: 'http://10.0.0.5:8811/v1',
  })
  assert.equal(cfg.bunBin, '/opt/bun/bin/bun')
  assert.equal(cfg.embeddingModel, 'llama-server:my-embed')
  assert.equal(cfg.embeddingDimensions, 768)
  assert.equal(cfg.device, 'gpu')
  assert.equal(cfg.embedServerBaseURL, 'http://10.0.0.5:8811/v1')
})

test('splitEmbeddingModel: provider:model', () => {
  assert.deepEqual(splitEmbeddingModel('llama-server:qwen3-embed'), { provider: 'llama-server', model: 'qwen3-embed' })
  assert.deepEqual(splitEmbeddingModel('voyage:voyage-4'), { provider: 'voyage', model: 'voyage-4' })
})

test('splitEmbeddingModel: bare id defaults to llama-server', () => {
  assert.deepEqual(splitEmbeddingModel('qwen3-embed'), { provider: 'llama-server', model: 'qwen3-embed' })
})

test('splitEmbeddingModel: empty id stays empty', () => {
  assert.deepEqual(splitEmbeddingModel(''), { provider: '', model: '' })
})
