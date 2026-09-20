#!/usr/bin/env bash
# gbrain-serve container — shared nemo-brain, LAN mode
#
# Topology (PC host, single Docker host):
#   gbrain-pg    pgvector/pgvector:pg16   host 127.0.0.1:5432 (PC CLI) + gbrain-net (serve)
#   gbrain-serve gbrain-serve:<ver>       host 0.0.0.0:8787 (Mac thin client + PC)
#   gbrain-embed llama.cpp embed server   host 0.0.0.0:8811 (serve reaches it via host.docker.internal)
#   qwen38-27b   LLM chat (GPU)           host 127.0.0.1:8823
#
# The serve container is a THIN HTTP/OAuth server over the shared Postgres —
# it holds no local data. Its GBRAIN_HOME mount supplies config.json + .env,
# but container env vars (GBRAIN_DATABASE_URL, LLAMA_SERVER_*) OVERRIDE the
# mounted file values (gbrain never lets .env override live env).
#
# Prereqs: docker network gbrain-net, gbrain-pg container, gbrain-serve image.
# Rebuild the image only when the gbrain version changes:
#   bun build --compile --target=bun-linux-x64 --minify --sourcemap \
#     --outfile gbrain src/cli.ts     # in the gbrain package dir
#   docker build -t gbrain-serve:<ver> -f deploy/serve/Dockerfile <dir-with-binary>
set -euo pipefail

GBRAIN_HOME_HOST="${GBRAIN_HOME_HOST:-$HOME/work/harness-projects/brain/nemo-brain}"
PG_USER="${GBRAIN_PG_USER:-gbrain}"
PG_PASSWORD="${GBRAIN_PG_PASSWORD:?set GBRAIN_PG_PASSWORD}"
PUBLIC_URL="${GBRAIN_PUBLIC_URL:-http://192.168.0.145:8787}"   # the address the Mac uses
HOST_BIND="${GBRAIN_HOST_BIND:-0.0.0.0}"
HOST_PORT="${GBRAIN_HOST_PORT:-8787}"
IMAGE="${GBRAIN_SERVE_IMAGE:-gbrain-serve:0.48.3.0}"

docker rm -f gbrain-serve 2>/dev/null || true

# Home-LAN topology => HTTP issuer (no TLS on a private WiFi network).
# MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL is the SDK escape hatch; every
# MCP endpoint still requires an OAuth token and the admin dashboard a
# bootstrap token. Revisit if this ever leaves the LAN (Tailscale +
# tailscale cert would allow dropping this).
INSECURE=1

docker run -d --name gbrain-serve \
  --restart unless-stopped \
  --network gbrain-net \
  --add-host=host.docker.internal:host-gateway \
  -p "${HOST_BIND}:${HOST_PORT}:8787" \
  -v "${GBRAIN_HOME_HOST}/.gbrain:/gbrain-home/.gbrain" \
  -e GBRAIN_HOME=/gbrain-home \
  -e "GBRAIN_DATABASE_URL=postgres://${PG_USER}:${PG_PASSWORD}@gbrain-pg:5432/brain" \
  -e LLAMA_SERVER_BASE_URL=http://host.docker.internal:8811/v1 \
  -e LLAMA_SERVER_API_KEY=local-dev-key \
  -e MCP_DANGEROUSLY_ALLOW_INSECURE_ISSUER_URL=$INSECURE \
  "$IMAGE" \
  serve --http --port 8787 --bind 0.0.0.0 --public-url "$PUBLIC_URL"

echo "gbrain-serve started. Health: curl -fsS ${PUBLIC_URL}/health"
