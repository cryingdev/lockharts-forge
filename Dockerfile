# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2) Serve stage
FROM nginx:alpine

# Cloud Run은 8080 포트를 기본으로 사용하므로 nginx도 8080으로 리슨
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite build output: dist/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]