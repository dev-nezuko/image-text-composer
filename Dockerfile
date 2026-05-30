FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# `output: 'export'` produces a static site, so it is served by a static server
# rather than Node. Nothing here needs a running application server.
FROM nginx:alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
