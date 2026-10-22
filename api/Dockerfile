# AageOnline — Standalone REST API Container
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install dependencies
COPY package.json tsconfig.json ./
RUN npm install --omit=dev

# Copy source code
COPY src ./src

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health/live || exit 1

CMD ["node", "--experimental-strip-types", "src/server.ts"]
