FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
# Allow native modules blocked by pnpm
RUN yes | pnpm approve-builds better-sqlite3
# Install build tools + node-gyp globally (with retry for network flakiness)
RUN apt-get update && apt-get install -y python3 build-essential && \
    npm install -g node-gyp --prefer-online 2>&1 || \
    npm install -g node-gyp --prefer-online 2>&1
# Rebuild better-sqlite3 native module
RUN cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    node-gyp rebuild 2>&1 || \
    (npm install -g node-gyp --prefer-online && node-gyp rebuild)
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
RUN mkdir -p /app/data
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
COPY --from=builder /app/knexfile.js ./knexfile.js
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh
EXPOSE 9002
ENTRYPOINT ["sh", "./docker/entrypoint.sh"]
CMD ["sh", "-lc", "PORT=9002 pnpm run start"]
