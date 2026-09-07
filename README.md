# dsh-gbrain

A DeepSeek Harness control panel for [gbrain](https://github.com/garrytan/gbrain) brains.

It does **not** replace the gbrain CLI — the CLI stays the contract for agents
(bash is the integration surface). This plugin is the *operator's* panel: a
Settings tab that shows the brain's own health, lets you quality-check
retrieval by hand, changes the embedding model (any `provider:model`),
starts/stops embed jobs, and flips the embedding server between CPU and GPU.

## What the panel does

| Card | What it is | How it works |
|---|---|---|
| **Brain health** | doctor status/score + per-source pages/chunks/embed coverage + last sync | `gbrain doctor --json` and `gbrain sources status --json`, shown verbatim |
| **Embed server** | reachability, listed models, configured-model check, **live 1024-dimension probe** | `GET <base>/models`, then one `POST <base>/embeddings` and measuring the vector |
| **Embed operations** | start a detached `gbrain embed --stale` (live log tail, pollable), stop it (SIGTERM), recreate the embedding container on CPU or GPU | detached node child with a state file under the brain; `docker stop/rm/run` with `-ngl 0` or `-ngl 99` |
| **Search QC** | run a retrieval exactly as an agent would and read the raw output | `gbrain search <q> --limit N` (hybrid) or `gbrain query <q> --limit N` (with multi-query expansion) |
| **Embedding model** | any `provider:model` + base URL + API key, applied **and verified** before data flows | `gbrain config set embedding_model / embedding_dimensions / provider_base_urls.<provider>` + merge-write of `$GBRAIN_HOME/.gbrain/.env` |
| **Connection** | where the brain lives and how the CLI is reached | persisted settings; empty `gbrainHome` falls back to `$GBRAIN_HOME` then `~/.gbrain` |

### Pointing it at an existing brain

Set `gbrainHome` in the Connection card (or `GBRAIN_HOME` in the environment,
or `DSH_GCBRAIN_HOME`). That's the whole story — the panel runs the gbrain CLI
with that brain as `GBRAIN_HOME` and reads what the CLI says. No database is
opened by the plugin itself.

### The 1024-dimension rule

PGLite cannot `ALTER` a vector column's dimension, so a brain initialized
with 1024 dims **cannot** switch to another dimension without a full
wipe + re-init. The panel enforces this in two places:

1. the settings validator refuses a dimension change on a persisted brain;
2. **Apply & verify** runs the live dimension probe *before* declaring
   success, so a wrong-dim model is caught with `MISMATCH` while no data has
   been written.

### The embedding container

The default recipe is a `ghcr.io/ggml-org/llama.cpp:server-cuda` container
named `gbrain-embed` publishing the server on `0.0.0.0:8811` (deliberately an
uncommon port), mounting the model directory read-only, with `Qwen3-Embedding-
0.6B` loaded. The device toggle recreates it:

- **CPU** → `-ngl 0` (safe: the 0.6B embed model costs the LLM nothing)
- **GPU** → `-ngl 99` (fast, needs ~1–1.5 GB VRAM)

## Install

```sh
dsh plugin --profile web add /path/to/dsh-gbrain   # or the github spec
```

Restart `dsh web` once; the **GBrian** section appears in Settings.

The gbrain CLI must be reachable on the host (its bin's shebang is
`#!/usr/bin/env bun`, so the panel invokes `bun <gbrain bin>` — set
`bunBin` / `gbrainBin` in the Connection card if they are not on the
standard paths).

## Configuration

Settings tab (persisted), each field also overridable by environment:

| Field | Env | Default |
|---|---|---|
| `gbrainHome` | `DSH_GCBRAIN_HOME` (or `GBRAIN_HOME`) | `~/.gbrain` |
| `bunBin` | `DSH_GCBRAIN_BUN_BIN` | `bun` |
| `gbrainBin` | `DSH_GCBRAIN_BIN` | auto (next to bun, else `gbrain`) |
| `embedServerBaseURL` | `DSH_GCBRAIN_EMBED_URL` | `http://127.0.0.1:8811/v1` |
| `embedServerAPIKey` | `DSH_GCBRAIN_EMBED_KEY` | *(empty)* |
| `embeddingModel` | `DSH_GCBRAIN_EMBED_MODEL` | `llama-server:qwen3-embed` |
| `embeddingDimensions` | `DSH_GCBRAIN_EMBED_DIMS` | `1024` |
| `containerName` | `DSH_GCBRAIN_CONTAINER` | `gbrain-embed` |
| `containerImage` | `DSH_GCBRAIN_CONTAINER_IMAGE` | `ghcr.io/ggml-org/llama.cpp:server-cuda` |
| `containerModelPath` | `DSH_GCBRAIN_CONTAINER_MODEL` | `/models/Qwen3-Embedding-0.6B-Q8_0.gguf` |
| `modelHostDir` | `DSH_GCBRAIN_MODEL_HOST_DIR` | host dir mounted as `/models` |
| `containerHostPort` | `DSH_GCBRAIN_CONTAINER_PORT` | `8811` |
| `device` | `DSH_GCBRAIN_DEVICE` | `cpu` |

## HTTP API (same-origin)

```
GET  /dsh-gbrain/health            bun / gbrain / brain-home / embed-server checks
GET  /dsh-gbrain/status            doctor + sources status + embed job
POST /dsh-gbrain/search            {query, mode: search|query, limit}
POST /dsh-gbrain/embed/start       start detached `gbrain embed --stale`
GET  /dsh-gbrain/embed/status      running/pid/log tail
POST /dsh-gbrain/embed/stop        SIGTERM the job
GET  /dsh-gbrain/probe             /models + dimension probe
POST /dsh-gbrain/config/apply      apply model settings + verify
POST /dsh-gbrain/container/recreate  {device: cpu|gpu}
```

## Development

```sh
npm install            # esbuild + react (dev only; react is external at runtime)
npm run build:client   # -> lib/client.js (self-registering DSH client module)
npm test               # node --test: config, gbrain client (mock spawn/fetch,
                       #   real child for the job lifecycle), routes (mock seams)
```

## License

MIT — see [LICENSE](LICENSE).
