FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts skips Fabric's optional node-canvas binary download; the
# editor renders in the browser and never needs Fabric's Node backend.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# `output: 'export'` produces a static site, so it is served by a static server
# rather than Node. Nothing here needs a running application server.
FROM nginx:1.30-alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
