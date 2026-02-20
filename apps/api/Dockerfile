# Stage 1: Pruner - extract API dependencies
FROM node:20-alpine AS pruner

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy entire monorepo
COPY . .

# Prune the monorepo to only include API dependencies
RUN turbo prune api --docker

# Stage 2: Installer - install dependencies
FROM node:20-alpine AS installer

RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files from pruner
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Stage 3: Builder - build the application
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy full source from pruner
COPY --from=pruner /app/out/full/ .

# packages/config has no package.json so turbo prune omits it — copy manually
COPY --from=pruner /app/packages/config ./packages/config

# Copy node_modules from installer
COPY --from=installer /app/node_modules ./node_modules

# Ensure workspace binaries (nest, etc.) are on PATH for build scripts
ENV PATH="/app/node_modules/.bin:${PATH}"

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the API
RUN npx turbo build --filter=api

# Stage 4: Runner - production runtime
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/packages ./packages

# Copy Prisma schema for migrations
COPY --from=builder --chown=nestjs:nestjs /app/packages/database/prisma/schema.prisma ./prisma/schema.prisma

USER nestjs

EXPOSE 4000

ENV PORT=4000

CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema=./packages/database/prisma/schema.prisma --skip-generate && node dist/main.js"]
