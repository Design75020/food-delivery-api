# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -qq && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# Generate Prisma client (dummy URL for build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-slim AS production

# Install OpenSSL for Prisma runtime
RUN apt-get update -qq && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production + prisma deps
RUN pnpm install --frozen-lockfile --prod

# Re-generate Prisma client
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Migration is handled inside server.ts via execSync
CMD ["node", "dist/server.js"]
