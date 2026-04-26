FROM node:22-alpine AS base
RUN npm install -g pnpm@9.12.0
WORKDIR /app

# Workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Package manifests (needed for workspace resolution)
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @espelmes/api build
RUN pnpm --filter @espelmes/api exec prisma generate

EXPOSE 4000
CMD ["pnpm", "--filter", "@espelmes/api", "start:prod"]
