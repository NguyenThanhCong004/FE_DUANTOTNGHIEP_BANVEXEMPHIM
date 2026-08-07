# Bước 1: Build ứng dụng React (Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
# Ép Node.js ưu tiên IPv4 khi resolve DNS: tránh npm ci bị treo/lỗi trên VPS
# chỉ có IPv6 link-local (không có route IPv6 thật ra ngoài Internet)
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm ci

# Copy toàn bộ code và build bản production
COPY . .
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Bước 2: Sử dụng Nginx để chạy bản build
FROM nginx:stable-alpine

# Copy file đã build từ bước 1 vào thư mục mặc định của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx.conf để fix lỗi F5 (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
