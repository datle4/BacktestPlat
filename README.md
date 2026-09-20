# BacktestPlat

Nền tảng kiểm thử chiến lược giao dịch cổ phiếu từ dữ liệu lịch sử OHLCV và tín hiệu Quant.

**Trạng thái: đã thiết lập nền tảng, dừng trước khi triển khai tính năng nghiệp vụ theo yêu cầu.**
Hiện có Spring Boot, kết nối database, PostgreSQL Docker, frontend React và CI.
Chưa có bảng cổ phiếu, dữ liệu giá, API nghiệp vụ, Quant provider hoặc engine backtest.

## Công nghệ

- Backend: Java 21+, Spring Boot 4.1.1, Maven Wrapper, Spring MVC, JDBC, Flyway.
- Frontend: React 19, TypeScript, Vite, React Query, React Router, Zustand.
- Database: PostgreSQL 17.10 chạy Docker; H2 dùng cho test nhanh.
- Kiểm thử: JUnit, Vitest, Playwright, axe; GitHub Actions.

## Cấu trúc

```text
backend/       Spring Boot và test kết nối database
frontend/      Màn hình nền BacktestPlat, theme sáng/tối
compose.yaml   PostgreSQL local và volume dữ liệu
.env.example   Cấu hình local mẫu
docs/          Tiến độ, nhật ký và quy trình Git
```

## Chạy local

Yêu cầu: Java 21 trở lên, Node.js 24, npm 11, Docker Engine/Desktop và Docker Compose v2.
Các lệnh dưới đây dùng terminal tại thư mục gốc repository.

### 1. PostgreSQL bằng Docker

```sh
cp .env.example .env
docker compose up -d --wait db
docker compose ps
```

Kết nối: `localhost:55432`, database và user `backtestplat`, mật khẩu local trong `.env`.
Cổng `55432` tách biệt khỏi PostgreSQL khác đang dùng `5432`.
Volume `postgres-data` giữ dữ liệu qua các lần dừng/khởi động.

```sh
docker compose logs db
docker compose exec db psql -U backtestplat -d backtestplat
# Dừng container, giữ volume dữ liệu:
docker compose down
```

### 2. Backend

Trong terminal tại thư mục gốc:

```sh
set -a
. ./.env
set +a
cd backend
./mvnw spring-boot:run
```

Backend chạy tại `http://localhost:8080`. Log khởi động xác nhận kết nối PostgreSQL.
**Truy cập `/` hoặc `/api` hiện trả 404 vì chưa triển khai endpoint**; đây không phải lỗi setup.
Flyway đã cấu hình nhưng chưa có migration nghiệp vụ; thông báo `No migrations found` ở checkpoint này là bình thường.

### 3. Frontend

Mở terminal khác tại thư mục gốc:

```sh
cd frontend
npm ci
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173).
Trang hiện tại giới thiệu đúng phạm vi BacktestPlat và cho phép đổi theme.
Vite chuyển tiếp `/api` tới `localhost:8080` khi các API được phát triển.
Frontend không cần API key hoặc biến môi trường tại checkpoint setup.

## Biến môi trường

| Biến | Mặc định local | Mục đích |
| --- | --- | --- |
| `DB_USER` | `backtestplat` | Tài khoản PostgreSQL |
| `DB_PASSWORD` | `local-backtestplat` | Mật khẩu dành cho local |
| `DB_PORT` | `55432` | Cổng Docker publish trên host |
| `DB_URL` | `jdbc:postgresql://localhost:55432/backtestplat` | JDBC URL của backend |
| `PORT` | `8080` | Cổng HTTP backend |

Nếu đổi `DB_PORT`, cập nhật cả `DB_URL`. Nếu đổi `PORT`, sửa target proxy tương ứng trong `frontend/vite.config.ts`.
Compose đọc `.env` tự động; Spring Boot cần export biến như lệnh ở trên.
`POSTGRES_USER`/`POSTGRES_PASSWORD` chỉ được áp dụng khi khởi tạo volume lần đầu;
đổi `.env` không đổi tài khoản trong volume đã có dữ liệu.
Thông tin local không dùng cho môi trường public. Database chỉ bind `127.0.0.1`.

## Kiểm thử và CI

Backend, tại `backend/`:

```sh
./mvnw --batch-mode --no-transfer-progress verify
```

Lệnh mặc định kiểm tra bằng H2. Để kiểm tra PostgreSQL Docker đang chạy:

```sh
TEST_DB_URL=jdbc:postgresql://localhost:55432/backtestplat \
TEST_DB_USER=backtestplat \
TEST_DB_PASSWORD=local-backtestplat \
./mvnw --batch-mode --no-transfer-progress test
```

Frontend, tại `frontend/`:

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E kiểm tra màn hình nền ở 375, 768, 1024 và 1440px; theme sáng/tối,
bàn phím, giảm chuyển động và accessibility tự động.

Tại thư mục gốc:

```sh
docker compose --env-file .env.example config --quiet
```

CI chạy khi push `main`, `feature/*`, `fix/*`, `test/*` và khi mở PR:
Maven verify, test trên PostgreSQL service, kiểm tra Compose, frontend lint/unit/build/E2E.

## Kiến trúc nghiệp vụ dự kiến — chưa triển khai

```text
Dữ liệu OHLCV → Quant provider → BUY / SELL / HOLD
                                  ↓
                      Backtest engine → Order execution
                                  ↓
                           Portfolio → Metrics
```

Quant chỉ quyết định tín hiệu. Backend quyết định phiên khớp, giá, số lượng, phí,
tiền mặt và vị thế. Tín hiệu sau phiên T khớp tại OPEN của phiên tiếp theo **có trong dữ liệu**.
Cặp `stock_id + trading_date` sẽ có ràng buộc unique và ingestion sẽ idempotent.
Mock Quant xác định sẽ được làm trước; HTTP Quant adapter theo sau.

Chưa có cấu hình Quant, hướng dẫn chạy backtest, biểu đồ vốn hoặc lịch sử giao dịch.
Các mục này sẽ được bổ sung khi tính năng tương ứng được triển khai và kiểm thử.
Compose hiện chỉ chạy database; đóng gói toàn bộ ứng dụng bằng Docker thuộc giai đoạn sau.
Không triển khai authentication, user management, Redis, Kafka hoặc microservices trong MVP này.

## Tiếp tục phát triển

- [Trạng thái dự án](docs/project-status.md)
- [Nhật ký phát triển](docs/development-log.md)
- [Quy trình Git được yêu cầu](docs/workflow.md)

Mỗi tính năng bắt đầu từ `main` mới nhất, có nhánh `feature/<tên>`, test, commit,
push và merge riêng; giữ nguyên nhánh remote. Không rewrite history hoặc force push.
**Checkpoint hiện tại yêu cầu dừng tại setup. Chỉ bắt đầu stock storage sau khi người dùng chọn mô hình và yêu cầu tiếp tục.**
