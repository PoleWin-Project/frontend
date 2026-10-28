FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund \
    && npm cache clean --force

ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL} \
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=${EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB} \
    EXPO_NO_TELEMETRY=1

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime

LABEL org.opencontainers.image.title="polewin-frontend" \
      org.opencontainers.image.source="https://github.com/PoleWin-Project/frontend"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1
