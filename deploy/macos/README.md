# gbrain single-brain topology — Mac thin client

One brain, one database, both machines.

```
        LAN (WiFi, 192.168.0.x)
 ┌────────────────────┐         ┌──────────────────────────────────────────┐
 │  MAC               │  HTTP   │  PC (192.168.0.145)                     │
 │  • Obsidian vault  │  MCP +  │  docker containers (gbrain-net):        │
 │    = second-brain  │  OAuth  │  • gbrain-pg    Postgres+pgvector :5432 │
 │      git repo      │ ──────► │    (the ONE brain DB, 127.0.0.1 only)   │
 │  • gbrain CLI      │ :8787   │  • gbrain-serve serve --http :8787      │
 │    (thin client,   │         │    (OAuth 2.1 + MCP /mcp + dashboard)   │
 │     NO local DB)   │         │  • gbrain-embed llama-server GPU :8811  │
 └────────────────────┘         │    (qwen3-embed, Qwen3-Embedding-0.6B)  │
        git push                │  • qwen38-27b  LLM :8823                │
   (second-brain)              └──────────────────────────────────────────┘
        │                              ▲
        └──► GitHub ──► PC: gbrain sync --source obsidian (manual)
```

- **Single source of truth**: the Postgres brain in `gbrain-pg`. The Mac never
  touches it directly — it talks to `gbrain-serve` over HTTP MCP with an
  OAuth 2.1 client-credentials token (`read` + `write` scopes, federated read
  across `default`, `obsidian`, `workspace-8b423e6d`; writes land in
  `default`).
- **Mac content path**: you write in Obsidian on the Mac → the vault IS the
  `second-brain` git repo → `git push` → on the PC you run
  `gbrain sync --source obsidian` (manual, no cron). That is how Mac notes
  enter the brain.
- **Mac gbrain CLI**: a *thin client* (`~/.gbrain/config.json` carries
  `remote_mcp`, no engine). `gbrain search/get/put/think/remember/doctor/...`
  all work from the Mac; DB-bound commands (`sync`, `embed`, `extract`,
  `migrate`, `serve`, `sources`, ...) are refused there by design.

## One-time setup

### Mac (the only new step)

1. Get this folder onto the Mac (clone `Siddharthm10/dsh-gbrain`, or copy
   `deploy/macos/`).
2. Make sure the PC is ON and reachable on the LAN (see health check below).
3. Run:

   ```bash
   cd dsh-gbrain/deploy/macos
   ./setup.sh
   ```

   The script installs Bun if missing, installs gbrain **pinned to v0.48.3.0**
   (the exact version the PC host runs), runs `gbrain init --mcp-only` (which
   pre-flight-smokes OAuth discovery, a token round-trip, and MCP initialize),
   then runs `gbrain doctor` and a live search. All values are embedded with
   env overrides: `GBRAIN_ISSUER_URL`, `GBRAIN_MCP_URL`,
   `GBRAIN_MAC_CLIENT_ID`, `GBRAIN_MAC_CLIENT_SECRET`, `GBRAIN_VERSION`.

4. Verify from the Mac:

   ```bash
   gbrain search "H1B sponsorship" --limit 3   # expect real hits
   gbrain doctor                               # thin-client check set
   ```

### PC (already done — recreate recipe if you ever wipe it)

```bash
cd dsh-gbrain/deploy/serve
./run-serve.sh          # starts gbrain-serve (image built from ./Dockerfile)
```

Containers expected after a full rebuild: `gbrain-pg`, `gbrain-serve`,
`gbrain-embed`, `qwen38-27b`. The brain DB lives in the `gbrain-pg` volume —
recreating `gbrain-serve` alone loses nothing.

Health check from either machine:

```bash
curl http://192.168.0.145:8787/health
```

## Day-to-day

| You want to... | Do |
|---|---|
| Add notes | Write in Obsidian on the Mac → `git push` in the vault |
| Bring new notes into the brain | On the PC: `gbrain sync --source obsidian` (see sync recipe below) |
| Search from the Mac | `gbrain search "query"` (or `gbrain think "..."` for reasoning) |
| Search from the PC | `gbrain search "query"` (full local CLI, same DB) |
| Write a page from the Mac | `gbrain put <slug>` / `remember` (lands in source `default`) |
| Brain health | `gbrain doctor` on either machine (Mac runs the thin-client set) |

### Sync recipe (PC, manual)

The obsidian source's git remote is over SSH, and this host's system
`/etc/ssh` config is broken for plain `ssh`, so the sync needs an explicit
ssh command:

```bash
export GIT_SSH_COMMAND='ssh -F /dev/null -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519_dsh'
export GBRAIN_HOME=/home/siddharthm10/work/harness-projects/brain/nemo-brain
/home/siddharthm10/work/harness-projects/.tools/bun/bin/gbrain sync --source obsidian
```

(There is no cron on purpose — syncs are manual. If a sync reports
`last_commit not an ancestor of HEAD`, it diffs tree-to-tree against the
orphaned bookmark and advances to HEAD; soft-deletes are recoverable 72h via
`gbrain restore`.)

## Troubleshooting

- **`/health` unreachable from Mac** — PC off/asleep, different network, or
  the `gbrain-serve` container is down. On the PC: `docker ps | grep gbrain`
  and re-run `deploy/serve/run-serve.sh` if needed.
- **Mac setup fails OAuth discovery** — issuer URL mismatch. The issuer is
  baked into the serve container **at startup** (`GBRAIN_PUBLIC_URL`). If the
  PC's IP changed: on the PC re-run
  `GBRAIN_PUBLIC_URL=http://<new-ip>:8787 ./run-serve.sh`, then on the Mac
  `GBRAIN_ISSUER_URL=http://<new-ip>:8787 GBRAIN_MCP_URL=http://<new-ip>:8787/mcp ./setup.sh`.
  **Prefer a DHCP reservation for 192.168.0.145 on the router** so this never
  happens.
- **MCP search returns 0 results but host CLI finds them** — the remote
  search applies a "safe chunks" fence: pages must be sealed with the current
  markdown chunker version (`chunker_version >= 4`). Imports/migrations that
  bypass the normal import path leave pages unsealed. Re-seal on the PC:
  `gbrain reindex --markdown` (dry-run first: `--dry-run` prints "would
  re-chunk N of M pending"). This bit us during the PGLite→Postgres
  migration (all 491 pages were at `-1`; one reindex run fixed it).
- **Token errors** — client credentials are in `setup.sh` (or env). They were
  re-registered when the old ones were revoked; if you rotate them on the PC
  (`gbrain auth register-client mac ...`), re-run `setup.sh` with
  `GBRAIN_MAC_CLIENT_ID`/`GBRAIN_MAC_CLIENT_SECRET` overrides.
- **Embedding fails from the serve container** — the container reaches the
  embedder at `http://host.docker.internal:8811/v1`. If you move the embedder,
  update `LLAMA_SERVER_BASE_URL` in `run-serve.sh`. Also: never reduce
  `-c 16384` / change `-np 4 -t 4` on `gbrain-embed` (2026-09-06 threading
  incident), and 1024 dims is hard-locked for this brain.

## Security notes

- HTTP (not HTTPS) is accepted because this is a home LAN: the serve
  container sets `MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL=1`. The Mac's
  client secret travels in the clear on your own WiFi — fine for a single
  trusted user, revisit with Tailscale+TLS if this ever leaves the LAN.
- The "mac" client has `read` + `write` only (no `admin`) — least privilege.
  `gbrain remote ping/doctor` (which need admin) are intentionally
  unavailable to it; `gbrain doctor` on the Mac runs its own thin-client
  check set locally.
- `gbrain-pg` binds to 127.0.0.1 only on the PC; only `gbrain-serve` exposes
  the brain to the network.
