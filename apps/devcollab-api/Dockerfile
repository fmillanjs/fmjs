FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune devcollab-api --docker

FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/full/ .
# packages/config has no package.json so turbo prune omits it — copy manually
COPY --from=pruner /app/packages/config ./packages/config
# Copy node_modules from installer (root + workspace-specific)
# @nestjs/cli is NOT hoisted to root due to peer dep conflict — copy workspace node_modules too
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/devcollab-api/node_modules ./apps/devcollab-api/node_modules

ENV PATH="/app/apps/devcollab-api/node_modules/.bin:/app/node_modules/.bin:${PATH}"

RUN npx prisma generate --schema=packages/devcollab-database/prisma/schema.prisma
RUN npx turbo build --filter=devcollab-api

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/apps/devcollab-api/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/packages ./packages
USER nestjs
EXPOSE 3003
ENV PORT=3003
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./packages/devcollab-database/prisma/schema.prisma && node dist/main.js"]
