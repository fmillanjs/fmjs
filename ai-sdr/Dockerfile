FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/prisma ./prisma
USER nestjs
EXPOSE 3001
ENV PORT=3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
