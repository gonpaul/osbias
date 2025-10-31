FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Create data directory for persistent storage
RUN mkdir -p /app/data
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
COPY --from=builder /app/knexfile.js ./knexfile.js
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh
RUN npm prune --omit=dev
RUN chmod +x ./docker/entrypoint.sh
EXPOSE 9002
ENTRYPOINT ["sh", "./docker/entrypoint.sh"]
CMD ["sh", "-lc", "PORT=9002 npm run start"]