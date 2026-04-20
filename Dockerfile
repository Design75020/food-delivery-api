# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma (required on Alpine)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (prisma is now in dependencies, not devDependencies)
RUN pnpm install --frozen-lockfile

# Generate Prisma client — reads schema.prisma only, no real DB needed
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Install OpenSSL for Prisma runtime (required on Alpine)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies (includes prisma now)
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
