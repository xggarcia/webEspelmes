FROM node:22-alpine AS base
RUN npm install -g pnpm@9.12.0

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files for workspace resolution
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build
RUN pnpm --filter @espelmes/api build

# Generate Prisma client
RUN pnpm --filter @espelmes/api exec prisma generate

EXPOSE 4000
CMD ["pnpm", "--filter", "@espelmes/api", "start:prod"]
