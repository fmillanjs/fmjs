FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune devcollab-web --docker

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
COPY --from=installer /app/node_modules ./node_modules
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=devcollab-web

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/.next/static ./apps/devcollab-web/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/devcollab-web/public ./apps/devcollab-web/public 2>/dev/null || true
USER nextjs
EXPOSE 3002
CMD ["node", "apps/devcollab-web/server.js"]
