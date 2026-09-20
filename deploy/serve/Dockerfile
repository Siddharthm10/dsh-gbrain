# gbrain-serve — OAuth 2.1 + MCP server for the shared nemo-brain
#
# The gbrain binary is a self-contained `bun build --compile` artifact
# (schema + PGLite assets embedded; no node_modules needed).
# Build context = a directory containing the compiled `gbrain` binary.
#
#   bun build --compile --target=bun-linux-x64 --minify --sourcemap \
#     --outfile gbrain src/cli.ts
#   docker build -t gbrain-serve:<gbrain-version> -f deploy/serve/Dockerfile <build-dir>

FROM debian:bookworm-slim

# glibc base: bun-linux-x64 is a glibc build (alpine/musl will not run it).
# curl = container self-checks only.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 -s /bin/sh gbrain

# Binary goes in PATH; GBRAIN_HOME is where config.json / .env are mounted.
COPY gbrain /usr/local/bin/gbrain
RUN chmod 755 /usr/local/bin/gbrain \
    && mkdir -p /gbrain-home/.gbrain \
    && chown -R gbrain:gbrain /gbrain-home /usr/local/bin/gbrain

USER gbrain
WORKDIR /gbrain-home
ENV GBRAIN_HOME=/gbrain-home

EXPOSE 8787

# Health probe: /health is served by gbrain serve --http (no auth).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8787/health || exit 1

# Default: LAN-facing serve. Host port mapping decides reachability.
# --public-url must be the address the Mac actually uses (LAN IP or
# Tailscale IP) — it is advertised in OAuth discovery.
ENTRYPOINT ["gbrain"]
CMD ["serve", "--http", "--port", "8787", "--bind", "0.0.0.0", "--public-url", "http://192.168.0.145:8787"]
