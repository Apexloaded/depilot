FROM node:22-alpine AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy dependency manifests first so Docker can cache installs correctly.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/depilot/package.json apps/depilot/package.json
COPY packages/firebase/package.json packages/firebase/package.json

RUN pnpm install

# Copy only the app and package sources needed for the production service.
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/depilot apps/depilot
COPY packages/firebase packages/firebase

RUN pnpm --filter @repo/firebase build && pnpm --filter depilot build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/depilot/package.json ./apps/depilot/package.json
COPY --from=builder /app/apps/depilot/dist ./apps/depilot/dist
COPY --from=builder /app/packages/firebase/package.json ./packages/firebase/package.json
COPY --from=builder /app/packages/firebase/dist ./packages/firebase/dist

WORKDIR /app/apps/depilot

EXPOSE 8080

CMD ["node", "dist/main.js"]
