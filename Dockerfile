FROM node:22-alpine AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY firebase.json firestore.indexes.json firestore.rules ./
COPY eplotone-firebase-admin.json ./

RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase.json ./firebase.json
COPY --from=builder /app/firestore.indexes.json ./firestore.indexes.json
COPY --from=builder /app/firestore.rules ./firestore.rules
COPY --from=builder /app/eplotone-firebase-admin.json ./eplotone-firebase-admin.json

EXPOSE 8080

CMD ["node", "dist/main.js"]
