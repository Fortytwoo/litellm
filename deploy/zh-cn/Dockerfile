FROM ghcr.io/berriai/litellm@sha256:2e4c0371f3a8c28e4da131d77abaa8341cd3b0c2fcc4d34d7c5900431af7b9d0
ARG REVISION
LABEL org.opencontainers.image.source="https://github.com/Fortytwoo/litellm"
LABEL org.opencontainers.image.revision="${REVISION}"
LABEL org.opencontainers.image.version="1.106.0-zh-cn"
RUN rm -rf /app/.venv/lib/python3.13/site-packages/litellm/proxy/_experimental/out
COPY ui/litellm-dashboard/out/ /app/.venv/lib/python3.13/site-packages/litellm/proxy/_experimental/out/
