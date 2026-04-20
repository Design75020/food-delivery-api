# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client — does NOT connect to DB, only reads schema.prisma
# A dummy URL is required to satisfy the env check at generate time
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Re-generate Prisma client in production image (still no real DB needed here)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# At runtime: run migrations (needs real DATABASE_URL) then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
