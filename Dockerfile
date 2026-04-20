# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Use Debian-based image to avoid OpenSSL issues with Prisma on Alpine
FROM node:22-slim AS builder

# Install OpenSSL (required by Prisma schema engine)
RUN apt-get update -qq && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client (no real DB needed at build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-slim AS production

# Install OpenSSL for Prisma runtime
RUN apt-get update -qq && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Re-generate Prisma client in production image
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# At runtime: run migrations then start server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
