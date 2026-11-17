FROM node:24-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma 6 uses the system OpenSSL library in the Debian image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

COPY . .

# Only a syntactically valid URL is needed while generating Prisma Client.
# Compose supplies the actual database URL and session secret at runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV SESSION_PASSWORD=build-only-placeholder-session-key-32-chars
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/eslint.config.mjs ./eslint.config.mjs
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

USER node
EXPOSE 3000

CMD ["sh", "-ec", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx prisma/seed.ts && exec node ./node_modules/next/dist/bin/next start -H 0.0.0.0"]
