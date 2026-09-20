# BacktestPlat

Nền tảng kiểm thử chiến lược giao dịch cổ phiếu từ dữ liệu lịch sử OHLCV và tín hiệu Quant.

**Trạng thái: Phase 1 đã hoàn tất — web cơ bản và dữ liệu lịch sử đã sẵn sàng.**
Backend có lưu trữ cổ phiếu/OHLCV, API đọc và lệnh Java nhập dữ liệu lịch sử một lần.
Frontend có ba trang: tổng quan thị trường, danh sách cổ phiếu và không gian chuẩn bị backtest.
Đang dừng tại ranh giới Phase 1; engine backtest và Quant chưa được triển khai.

## Công nghệ

- Backend: Java 21+, Spring Boot 4.1.1, Maven Wrapper, Spring MVC, JDBC, Flyway.
- Frontend: React 19, TypeScript, Vite, React Query, React Router, Zustand.
- Database: PostgreSQL 17.10 chạy Docker; H2 dùng cho test nhanh.
- Kiểm thử: JUnit, Vitest, Playwright, axe; GitHub Actions.

## Cấu trúc

```text
backend/       Spring Boot, API cổ phiếu/OHLCV và importer Java
frontend/      Ba trang React: thị trường, cổ phiếu và bản nháp backtest
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

Backend chạy tại `http://localhost:8080`. Các endpoint hiện có:

- `GET /api/stocks`
- `GET /api/stocks/{symbol}`
- `GET /api/stocks/{symbol}/prices?from=2021-01-01&to=2026-09-20`

### 3. Nhập dữ liệu lịch sử một lần bằng Java

Importer dùng thư viện Java `yfinance4j`, lấy dữ liệu Yahoo Finance cho 15 mã HOSE
(mã nguồn có hậu tố `.VN`), rồi lưu vào PostgreSQL Docker.
Sau khi database đã chạy và biến môi trường đã được export như bước 2:

```sh
cd backend
MARKET_DATA_IMPORT_ENABLED=true ./mvnw --batch-mode --no-transfer-progress spring-boot:run
```

Tiến trình tự thoát khi hoàn tất. Khoảng mặc định là 01/01/2021–20/09/2026;
ngày kết thúc là cutoff cố định, không tự đổi theo ngày chạy. Upsert theo mã và ngày giao dịch
nên có thể chạy lại an toàn. Bản ghi nguồn thiếu hoặc có OHLCV mâu thuẫn bị ghi cảnh báo và bỏ qua,
không được tự sửa hoặc dựng dữ liệu thay thế.

### 4. Frontend

Mở terminal khác tại thư mục gốc:

```sh
cd frontend
npm ci
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173).
- `/`: tổng quan nhóm theo dõi, độ rộng, khối lượng, biểu đồ giá và 5 mã giao dịch sôi động.
- `/stocks`: tìm theo mã/tên, sắp xếp, chọn mã để xem lịch sử theo khoảng ngày và 12 phiên OHLCV gần nhất. Có thể mở trực tiếp `/stocks?symbol=FPT`.
- `/backtest`: nhập cổ phiếu, ngày, vốn và phí rồi lưu cấu hình nháp trong trình duyệt. Chưa chạy mô phỏng hoặc tạo kết quả; engine thuộc Phase 2.

Giao diện dùng Inter tự host có ký tự tiếng Việt, hỗ trợ màn hình nhỏ và theme sáng/tối/hệ thống.
Số liệu trang chủ chỉ đại diện nhóm mã có dữ liệu, không phải VN-Index hoặc toàn thị trường;
thống kê phiên mới nhất chỉ gộp các mã cùng ngày. Không có tin tức hoặc giá trực tiếp.
Vite chuyển tiếp `/api` tới backend tại `localhost:8080`.
Frontend không cần API key hoặc biến môi trường riêng.

## Biến môi trường

| Biến | Mặc định local | Mục đích |
| --- | --- | --- |
| `DB_USER` | `backtestplat` | Tài khoản PostgreSQL |
| `DB_PASSWORD` | `local-backtestplat` | Mật khẩu dành cho local |
| `DB_PORT` | `55432` | Cổng Docker publish trên host |
| `DB_URL` | `jdbc:postgresql://localhost:55432/backtestplat` | JDBC URL của backend |
| `PORT` | `8080` | Cổng HTTP backend |
| `MARKET_DATA_IMPORT_ENABLED` | `false` | Chạy importer Java một lần rồi thoát |
| `MARKET_DATA_IMPORT_START` | `2021-01-01` | Ngày bắt đầu lịch sử |
| `MARKET_DATA_CUTOFF` | `2026-09-20` | Ngày kết thúc cố định, bao gồm ngày này |

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

E2E kiểm tra cả ba trang ở 375, 768, 1024 và 1440px; theme sáng/tối,
bàn phím, giảm chuyển động, lưu/khôi phục nháp, lỗi/tải lại và accessibility tự động.

Tại thư mục gốc:

```sh
docker compose --env-file .env.example config --quiet
```

CI chạy khi push `main`, `feature/*`, `fix/*`, `test/*` và khi mở PR:
Maven verify, test trên PostgreSQL service, kiểm tra Compose, frontend lint/unit/build/E2E.

## Kiến trúc nghiệp vụ

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
Mock Quant xác định sẽ được làm trước; HTTP Quant adapter chờ code/API của bạn cộng tác và yêu cầu tích hợp sau.

Chưa có cấu hình Quant, hướng dẫn chạy backtest, biểu đồ vốn hoặc lịch sử giao dịch.
Các mục này sẽ được bổ sung khi tính năng tương ứng được triển khai và kiểm thử.
Compose hiện chỉ chạy database; đóng gói toàn bộ ứng dụng bằng Docker thuộc giai đoạn sau.
Không triển khai authentication, user management, Redis, Kafka hoặc microservices trong MVP này.

## Phạm vi dữ liệu hiện tại

Dùng bộ dữ liệu lịch sử cố định đến hết **20/09/2026** (múi giờ Việt Nam), chỉ gồm
các phiên đã hoàn tất và có dữ liệu từ nguồn. Mốc này không tự tăng theo ngày mở ứng dụng.
Mặc định importer tải 15 mã HOSE từ 01/01/2021:
`ACB`, `FPT`, `GAS`, `HPG`, `MBB`, `MSN`, `MWG`, `PLX`, `PNJ`, `SSI`, `TCB`, `VCB`, `VHM`, `VIC`, `VNM`.
Bộ theo dõi có ngân hàng, công nghệ, thép, năng lượng, tiêu dùng, bán lẻ, chứng khoán và bất động sản;
đây không phải danh sách đầy đủ của thị trường hoặc khuyến nghị đầu tư.

Snapshot local đã kiểm tra: **22.296 bản ghi**, phiên mới nhất **18/09/2026**;
bảng giá và index khoảng **3,3 MB** (không gồm image Docker, WAL và các thành phần khác).
15 bản ghi nguồn có OHLCV mâu thuẫn đã được ghi cảnh báo và bỏ qua.

Phạm vi hiện tại chỉ có nhập dữ liệu lịch sử một lần, **chưa có scheduler hằng ngày,
tải bù lúc khởi động hoặc cập nhật nền**. Khi cần cập nhật thêm, sẽ thiết kế tiếp theo yêu cầu.
Web MVP chạy bằng Quant giả lập; Quant thật được tích hợp sau khi có code/API từ bạn cộng tác.
Các điều chỉnh này thay thế yêu cầu cập nhật hằng ngày và tích hợp Quant thật trong phạm vi MVP trước đó.

## Tiếp tục phát triển

- [Trạng thái dự án](docs/project-status.md)
- [Nhật ký phát triển](docs/development-log.md)
- [Quy trình Git được yêu cầu](docs/workflow.md)

Mỗi tính năng bắt đầu từ `main` mới nhất, có nhánh `feature/<tên>`, test, commit,
push và merge riêng; giữ nguyên nhánh remote. Không rewrite history hoặc force push.
