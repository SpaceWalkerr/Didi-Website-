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

# Only the server's dependencies — the client's build tools are not needed to run.
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev && npm cache clean --force

COPY server/src ./server/src
COPY --from=build /app/client/dist ./client/dist

# Bookings live on a mounted volume, not in the image — see fly.toml.
ENV DATA_DIR=/data
ENV PORT=8080
EXPOSE 8080

# Run as a non-root user; the volume is chowned to it at mount time.
RUN addgroup -S clinic && adduser -S clinic -G clinic && mkdir -p /data && chown clinic:clinic /data
USER clinic

CMD ["node", "server/src/index.js"]
