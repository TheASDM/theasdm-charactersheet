# --- Build stage ---
FROM node:20-bullseye AS build
WORKDIR /app

# Install dependencies with caching
COPY package.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/

RUN npm install --prefix backend \
 && npm install --prefix frontend \
 && npm run prisma:generate --prefix backend

COPY . .

RUN npm run build:server \
 && npm run build:client

RUN mkdir -p backend/dist/public \
 && cp -r frontend/dist/* backend/dist/public/

# --- Runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy node modules and built assets
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/frontend/dist backend/dist/public
COPY --from=build /app/docker docker
COPY package.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/

RUN mkdir -p /app/data

# Entrypoint script to run migrations, seed reference data, then start server
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'echo "[entrypoint] Using DATABASE_URL=$DATABASE_URL"' \
  'export PRISMA_SCHEMA_PATH="backend/prisma/schema.prisma"' \
  'backend/node_modules/.bin/prisma migrate deploy --schema "$PRISMA_SCHEMA_PATH" || true' \
  'node backend/dist/src/scripts/seed-reference.js || true' \
  'exec node backend/dist/src/server.js' \
  > /app/entrypoint.sh \
  && chmod +x /app/entrypoint.sh

EXPOSE 8080
ENV PORT=8080
CMD ["/app/entrypoint.sh"]
