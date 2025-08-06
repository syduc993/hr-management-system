# ==============================================================================
# STAGE 1: Build Frontend (React)
# ==============================================================================
# Sử dụng một Node.js image làm base để build
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép các file quản lý package và cài đặt dependencies
# Điều này tận dụng Docker layer caching, chỉ cài lại khi package.json thay đổi
COPY package.json package-lock.json ./
RUN npm install

# Sao chép toàn bộ source code của project vào container
COPY . .

# Chạy lệnh build của Vite để tạo ra các file static cho frontend
# Các file này sẽ được lưu trong thư mục /app/dist
RUN npm run build

# ==============================================================================
# STAGE 2: Production Image
# ==============================================================================
# Bắt đầu một stage mới từ một base image Node.js gọn nhẹ
FROM node:20-alpine

# Thiết lập thư mục làm việc cho môi trường production
WORKDIR /app

# Sao chép các file quản lý package từ stage trước
COPY package.json package-lock.json ./

# --- BẮT ĐẦU PHẦN ĐÃ SỬA ---
# Sao chép file .env vào trong image.
# Lệnh này sẽ hoạt động sau khi bạn đã xóa dòng '.env' khỏi file .dockerignore.
# Nhờ có file này, lệnh dotenv.config() trong server.js sẽ có thể đọc được các biến môi trường.
COPY .env .
# --- KẾT THÚC PHẦN ĐÃ SỬA ---

# Chỉ cài đặt các dependencies cần thiết cho production (bỏ qua devDependencies)
RUN npm install --omit=dev

# Sao chép mã nguồn của server từ thư mục local
COPY --chown=node:node ./server ./server

# Sao chép thư mục build của frontend từ stage "builder"
# Kết quả build của React sẽ được đặt vào thư mục /app/dist
COPY --chown=node:node --from=builder /app/dist ./dist

# Mở cổng 8080 mà server Express đang lắng nghe
EXPOSE 8080

# Chuyển sang người dùng "node" không có quyền root để tăng cường bảo mật
USER node

# Lệnh mặc định để khởi chạy server Node.js khi container bắt đầu
CMD [ "node", "server/server.js" ]
