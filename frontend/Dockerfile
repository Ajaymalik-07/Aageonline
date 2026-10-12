# syntax=docker/dockerfile:1
# AageOnline — Multi-Stage Production & Worker Dockerfile
# Milestone 0.20.2: Docker VPS + Managed PostgreSQL + Direct DNS Deployment

# --- Stage 1: Base Runtime ---
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

# --- Stage 2: Dependencies Installation ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 3: Builder ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Standalone build will be placed in .next/standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# --- Stage 4: Web Application Runner (Next.js Standalone) ---
FROM base AS web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public directory and compiled standalone application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Container liveness health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live || exit 1

CMD ["node", "server.js"]

# --- Stage 5: Background Reconciler Worker Runner ---
FROM base AS worker
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node --experimental-strip-types scripts/worker.ts --health || exit 1

CMD ["node", "--experimental-strip-types", "scripts/worker.ts"]

# --- Stage 6: Database Migrator (One-off Runner) ---
FROM base AS migrator
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

CMD ["node", "--experimental-strip-types", "scripts/migrate.ts"]
