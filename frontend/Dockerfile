# Multi-stage build for PredictRx-AI React Frontend

# Stage 1: Build production assets
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies using clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html tailwind.config.js postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build client distribution
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_ENABLE_MOCK_FALLBACK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ENABLE_MOCK_FALLBACK=$VITE_ENABLE_MOCK_FALLBACK

RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy customized Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
