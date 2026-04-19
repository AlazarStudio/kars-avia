FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# API URL задаётся при сборке через --build-arg
ARG VITE_BACKEND_HOST=localhost:4000
ENV VITE_DEV_PATH=$VITE_BACKEND_HOST
ENV VITE_DEV_SERVER=http://$VITE_BACKEND_HOST
ENV VITE_PRODUCTION_PATH=$VITE_BACKEND_HOST
ENV VITE_PRODUCTION_SERVER=http://$VITE_BACKEND_HOST
ENV VITE_DEMO_PATH=$VITE_BACKEND_HOST
ENV VITE_DEMO_SERVER=http://$VITE_BACKEND_HOST

RUN npm run build

# ---------- production stage ----------
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
