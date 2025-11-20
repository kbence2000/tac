FROM mcr.microsoft.com/devcontainers/universal:2

# Friss npm a lockfile problémákhoz
RUN corepack disable || true \
 && npm install -g npm@10

WORKDIR /workspace
