FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack and setup pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy the ENTIRE repository source (respects .dockerignore)
COPY . .

# Ensure no local host node_modules or build artifacts were copied into Docker
RUN find . -name "node_modules" -type d -prune -exec rm -rf {} + && \
    find . -name "dist" -type d -prune -exec rm -rf {} +

# Install ALL dependencies without triggering lifecycle scripts (opencollective, napi-postinstall, etc.)
RUN pnpm install --frozen-lockfile --unsafe-perm --dev --shamefully-hoist --config.ignore-scripts=true

# Build depilot and all its internal dependencies (@repo/firebase, etc.)
RUN pnpm --filter depilot... run build

# Production runtime image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/apps/depilot/package.json ./package.json
COPY --from=builder /app/apps/depilot/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 8080

CMD ["node", "dist/main.js"]