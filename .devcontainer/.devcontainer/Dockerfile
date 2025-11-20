FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Alap rendszer frissítés
RUN apt-get update && apt-get upgrade -y

# Cloudflare CLI (Wrangler)
RUN npm install -g wrangler

# Build essential + Git + curl + util
RUN apt-get install -y build-essential git curl unzip

# NodeJS 22 fallback (ha a feature valamiért hibázik)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs
