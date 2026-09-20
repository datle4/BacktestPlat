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

## Database và backend

```sh
cp .env.example .env
docker compose up -d db
cd backend
./mvnw spring-boot:run
```

Database local: `localhost:55432/backtestplat`. Giá trị mặc định dành cho máy phát triển.
Khi đổi `.env`, export các biến trước khi chạy backend: `set -a; . ./.env; set +a`.
Flyway áp dụng migration khi khởi động. Test mặc định dùng H2; để kiểm tra PostgreSQL:

```sh
cd backend
TEST_DB_URL=jdbc:postgresql://localhost:55432/backtestplat TEST_DB_USER=backtestplat TEST_DB_PASSWORD=local-backtestplat ./mvnw test
```
