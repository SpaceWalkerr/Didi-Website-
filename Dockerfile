# ─── Build the client ────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so this layer caches until dependencies actually change.
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY . .
RUN npm run build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# su-exec drops privileges in the entrypoint below.
RUN apk add --no-cache su-exec

# Only the server's dependencies — the client's build tools are not needed to run.
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev && npm cache clean --force

COPY server/src ./server/src
COPY --from=build /app/client/dist ./client/dist
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Bookings live on a mounted volume, not in the image — see fly.toml.
ENV DATA_DIR=/data
ENV PORT=8080
EXPOSE 8080

RUN addgroup -S clinic && adduser -S clinic -G clinic && mkdir -p /data

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/src/index.js"]
