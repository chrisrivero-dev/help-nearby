FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . /app/

# Build with NEXT_PUBLIC_ env vars
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID
ARG NEXT_PUBLIC_COGNITO_APP_CLIENT_ID
ARG NEXT_PUBLIC_COGNITO_REGION
ARG NEXT_PUBLIC_COGNITO_CLIENT_SECRET
ARG NEXT_PUBLIC_ENV

ENV NEXT_PUBLIC_COGNITO_USER_POOL_ID=$NEXT_PUBLIC_COGNITO_USER_POOL_ID
ENV NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=$NEXT_PUBLIC_COGNITO_APP_CLIENT_ID
ENV NEXT_PUBLIC_COGNITO_REGION=$NEXT_PUBLIC_COGNITO_REGION
ENV NEXT_PUBLIC_COGNITO_CLIENT_SECRET=$NEXT_PUBLIC_COGNITO_CLIENT_SECRET
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV

RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app
RUN npm install -g pnpm

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 5000

ENV PORT=5000

CMD ["pnpm", "start"]