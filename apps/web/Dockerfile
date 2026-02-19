# Stage 1: Pruner - extract web app dependencies
FROM node:20-alpine AS pruner

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy entire monorepo
COPY . .

# Prune the monorepo to only include web app dependencies
RUN turbo prune web --docker

# Stage 2: Installer - install dependencies
FROM node:20-alpine AS installer

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from pruner
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies
RUN npm ci

# Stage 3: Builder - build the application
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy full source from pruner
COPY --from=pruner /app/out/full/ .

# Copy node_modules from installer
COPY --from=installer /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build the web app
RUN npx turbo build --filter=web

# Stage 4: Runner - production runtime
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
