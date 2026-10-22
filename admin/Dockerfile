# AageOnline — Dedicated Admin Control Center Container
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# Copy application source code
COPY app ./app
COPY lib ./lib
COPY middleware.ts ./middleware.ts

# Build Next.js production bundle
RUN npm run build

EXPOSE 3001

# Container health probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["npm", "start"]


