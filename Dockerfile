# ==============================================================================
#           FINORA / TÍCH SẢN — MULTI-STAGE DOCKERFILE PHÂN TÁCH DỊCH VỤ
# ==============================================================================

# --- Giai đoạn 1: Build mã nguồn Frontend ---
FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# --- Giai đoạn 2: Base Web Nginx ---
FROM nginx:alpine AS web-base
COPY --from=builder /app/dist /usr/share/nginx/html

# --- Giai đoạn 3: Finora App Service (Cổng 7000) ---
FROM web-base AS app
COPY docker/nginx/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 7000
CMD ["nginx", "-g", "daemon off;"]

# --- Giai đoạn 4: Finora Landing Service (Cổng 7001) ---
FROM web-base AS landing
COPY docker/nginx/landing.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 7001
CMD ["nginx", "-g", "daemon off;"]

# --- Giai đoạn 5: Finora Auth Service (Cổng 7002) ---
FROM web-base AS auth
COPY docker/nginx/auth.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 7002
CMD ["nginx", "-g", "daemon off;"]

# --- Giai đoạn 6: Finora Backend API Service (Cổng 7003) ---
FROM node:22-alpine AS api
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV PORT=7003
ENV HOST=0.0.0.0

EXPOSE 7003
CMD ["pnpm", "exec", "tsx", "src/server/index.ts"]
