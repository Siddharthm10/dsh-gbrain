#!/usr/bin/env bash
# setup.sh — one-shot gbrain THIN CLIENT setup for the Mac.
#
# The Mac has NO local brain database. It connects over HTTP MCP + OAuth
# to the gbrain-serve container on the PC (same LAN), which owns the
# single Postgres brain. One brain, one DB, one set of containers.
#
# What this does (idempotent; safe to re-run):
#   1. installs Bun if missing
#   2. installs gbrain pinned to the SAME version the PC brain runs (v0.48.3.0)
#   3. runs `gbrain init --mcp-only` — writes ~/.gbrain/config.json with
#      remote_mcp (no local engine is created) and runs the pre-flight
#      smoke: OAuth discovery, token round-trip, MCP initialize
#   4. runs `gbrain doctor` (thin-client check set) and a live search test
#
# Prereq: the PC is ON, reachable at $GBRAIN_ISSUER_URL, and the
# gbrain-serve container is running (deploy/serve/run-serve.sh on the PC).
#
# Env overrides (defaults = the current deployment):
#   GBRAIN_ISSUER_URL   default http://192.168.0.145:8787
#   GBRAIN_MCP_URL      default http://192.168.0.145:8787/mcp
#   GBRAIN_MAC_CLIENT_ID     default: the "mac" OAuth client on the brain
#   GBRAIN_MAC_CLIENT_SECRET default: its secret
#   GBRAIN_VERSION      default v0.48.3.0 (matches the PC host CLI)

set -euo pipefail

ISSUER_URL="${GBRAIN_ISSUER_URL:-http://192.168.0.145:8787}"
MCP_URL="${GBRAIN_MCP_URL:-http://192.168.0.145:8787/mcp}"
CLIENT_ID="${GBRAIN_MAC_CLIENT_ID:-gbrain_cl_3a66a90ce6f0e682f659cc8954d2aae93a209bf9cca42982ccc0cf8f54269f06}"
CLIENT_SECRET="${GBRAIN_MAC_CLIENT_SECRET:-gbrain_cs_e4fdb5cc6f8180c244cde85f9be9867da6bbcc8536e75b2b281d015df205477b}"
VERSION="${GBRAIN_VERSION:-v0.48.3.0}"

echo "==> gbrain thin-client setup"
echo "    issuer: $ISSUER_URL"
echo "    mcp:    $MCP_URL"
echo "    client: ${CLIENT_ID:0:16}..."
echo "    version pin: $VERSION"

# --- 0. reachability pre-check -------------------------------------------------
echo "==> checking host reachability"
curl -fsS --max-time 5 "$ISSUER_URL/health" || {
  echo "ERROR: $ISSUER_URL/health unreachable." >&2
  echo "       Is the PC on and on the same network? Is gbrain-serve running?" >&2
  echo "       (On the PC: docker ps | grep gbrain-serve, or re-run deploy/serve/run-serve.sh)" >&2
  exit 1
}
echo "    host OK"

# --- 1. bun ---------------------------------------------------------------------
if ! command -v bun >/dev/null 2>&1; then
  echo "==> installing Bun"
  curl -fsSL https://bun.sh/install | bash
fi
export PATH="$HOME/.bun/bin:$PATH"
command -v bun >/dev/null 2>&1 || { echo "ERROR: bun still not on PATH after install ($HOME/.bun/bin). Open a new terminal." >&2; exit 1; }
echo "==> bun $(bun --version)"

# --- 2. pinned gbrain ------------------------------------------------------------
echo "==> installing gbrain (pinned $VERSION, same as PC host)"
bun install -g "github:garrytan/gbrain#$VERSION"
gbrain --version

# --- 3. thin-client init (preflight smoke: OAuth discovery, token, MCP init) -----
echo "==> gbrain init --mcp-only (writes ~/.gbrain/config.json, NO local DB)"
gbrain init --mcp-only --force \
  --issuer-url "$ISSUER_URL" \
  --mcp-url "$MCP_URL" \
  --oauth-client-id "$CLIENT_ID" \
  --oauth-client-secret "$CLIENT_SECRET"

# --- 4. doctor + live search smoke ------------------------------------------------
echo "==> gbrain doctor (thin-client check set)"
gbrain doctor

echo "==> live search test over MCP"
gbrain search "H1B sponsorship" --limit 3

cat <<'EOF'

Setup complete. The Mac is now a thin client of the single PC-hosted brain:

  • gbrain CLI here has NO local database — every read/write goes over
    HTTP MCP + OAuth to the PC's gbrain-serve container.
  • DB-bound commands (sync, embed, extract, migrate, serve, sources ...)
    are refused on this machine by design; they run on the PC.
  • Daily flow: write in Obsidian → git push (second-brain repo) →
    on the PC run: gbrain sync --source obsidian  (manual, no cron)
  • This CLI: gbrain search / get / put / think / remember / doctor ...
    (the full remote-facing tool surface, 93 tools).

If the PC's LAN IP changes: the issuer URL is baked into the serve
container at startup — re-run deploy/serve/run-serve.sh on the PC with
GBRAIN_PUBLIC_URL=<new-ip>:8787, then re-run this script on the Mac.
EOF
