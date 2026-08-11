FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
RUN npm ci --include-workspace-root \
  --workspace @scamsignal/core \
  --workspace @scamsignal/api-client

COPY . .
RUN npm run build

# Install only the production dependencies used by the web/server runtime.
# Running `npm prune --omit=dev` in the build stage traverses every workspace
# and pulls the Expo/React Native mobile tree into the Cloud Run image.
FROM node:22-alpine AS production-dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
RUN npm ci --omit=dev --include-workspace-root \
  --workspace @scamsignal/core \
  --workspace @scamsignal/api-client

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -g 1001 -S appgroup \
  && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
COPY --from=build --chown=appuser:appgroup /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/packages ./packages
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/server-dist ./server-dist

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server-dist/server/index.js"]
