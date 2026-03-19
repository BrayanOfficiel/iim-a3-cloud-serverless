FROM oven/bun:1 AS base
WORKDIR /app

# Copier le workspace root + les fichiers de dependances
COPY package.json ./
COPY code/api/package.json code/api/bun.lock* ./code/api/
COPY code/domain/package.json ./code/domain/
COPY code/crons/package.json ./code/crons/

# Installer les dependances depuis la racine du workspace
RUN bun install

# Copier le code source
COPY code/api/ ./code/api/
COPY code/domain/ ./code/domain/
COPY code/emails/ ./code/emails/

WORKDIR /app/code/api
EXPOSE 3000
CMD ["bun", "run", "dev"]
