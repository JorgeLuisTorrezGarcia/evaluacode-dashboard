# ============================================================================
# Frontend Dockerfile - Multi-stage build for EvaluaCode Dashboard (Vite + React)
# Target environment: Azure Container Apps / Azure App Service for Containers
# ============================================================================

# ------------ Stage 1: Install dependencies using Bun ------------
FROM oven/bun:1.1.23 AS deps
WORKDIR /app
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

# ------------ Stage 2: Build static assets ------------
FROM deps AS build
COPY tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
# Build frontend (Vite)
RUN bun run build

# ------------ Stage 3: Production image with minimal runtime ------------
FROM nginx:1.27.3-alpine AS production
WORKDIR /usr/share/nginx/html

# Copy compiled assets
COPY --from=build /app/dist ./

# Provide default nginx configuration optimized for SPA
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       80;
    listen       [::]:80;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # Serve static assets with caching
    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Basic security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
