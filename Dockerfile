# Bước 1: Build ứng dụng React (Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ code và build bản production
COPY . .
RUN npm run build

# Bước 2: Sử dụng Nginx để chạy bản build
FROM nginx:stable-alpine

# Copy file đã build từ bước 1 vào thư mục mặc định của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx.conf để fix lỗi F5 (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]