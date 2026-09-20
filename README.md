# BacktestPlat

Nền tảng mô phỏng giao dịch cổ phiếu từ dữ liệu OHLCV hằng ngày và tín hiệu Quant.
Spring Boot quản lý khớp lệnh, tiền mặt, vị thế, phí và hiệu suất. Quant chỉ tạo BUY / SELL / HOLD.
Frontend dùng React + TypeScript; cơ sở dữ liệu PostgreSQL chạy bằng Docker.

## Phát triển

Yêu cầu: Java 21+, Node.js 24, npm 11, Docker Compose.

```sh
cd backend
./mvnw test
# Terminal khác
cd frontend
npm ci
npm run dev
```

```sh
cd frontend
npm run lint
npm test
npm run build
```

Theo dõi tiến độ tại [docs/project-status.md](docs/project-status.md),
nhật ký tại [docs/development-log.md](docs/development-log.md).
Mỗi tính năng có nhánh riêng, được kiểm thử trước khi merge vào main.

## Quy tắc mô phỏng

Tín hiệu sau phiên T chỉ được khớp tại OPEN của phiên tiếp theo có trong dữ liệu.
Không khớp vào cùng phiên; không tự cộng một ngày để suy ra phiên giao dịch.
MVP không có đăng nhập hoặc quản lý người dùng.
