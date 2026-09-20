# VN Stock Dashboard

VN Stock Dashboard là dự án học tập xây dựng web theo dõi thị trường chứng khoán
Việt Nam theo kiến trúc **modular monolith**. Frontend được phát triển bằng React;
backend dùng Java/Spring Boot và được triển khai theo hướng mentor để người học tự
xây dựng từng module.

## Trạng thái hiện tại

Repository đang ở **Feature 0 — Foundation**:

- khung React/Vite và Spring Boot;
- OpenAPI nền với session cookie, CSRF và lỗi `ProblemDetail` chuẩn RFC 9457;
- PostgreSQL 18 và Mailpit cho môi trường local;
- skeleton production gồm frontend, backend, PostgreSQL và Caddy HTTPS;
- CI chạy lint/unit/build/E2E/axe frontend, kiểm tra OpenAPI, Maven verify backend
  và kiểm tra Docker Compose.

Chưa có endpoint hoặc schema nghiệp vụ. Chúng chỉ được thêm vào
[`contracts/openapi.yaml`](contracts/openapi.yaml) khi bắt đầu vertical slice tương ứng.
Mỗi checkpoint chỉ triển khai **một vertical slice**; tại checkpoint hiện tại,
Foundation là slice duy nhất đã được triển khai.

## Chạy checkpoint Foundation

Yêu cầu: Node.js 24, Java 25, Docker và Docker Compose.

```bash
cp .env.example .env
docker compose --env-file .env -f infra/compose.yml up -d
```

Mailpit UI chạy tại [http://localhost:8025](http://localhost:8025); PostgreSQL chỉ
được bind vào `127.0.0.1:5432`.
Compose dùng tài khoản bootstrap chỉ để khởi tạo database và tạo riêng tài khoản
ứng dụng `vnstock` không có quyền superuser.

Chạy backend Foundation (không cần API key):

```bash
set -a
. ./.env
set +a
unset POSTGRES_ADMIN_USER POSTGRES_ADMIN_PASSWORD
cd backend
./mvnw spring-boot:run
```

Các lệnh đầu export cấu hình ứng dụng để Spring dùng đúng database user/password
mà Compose đã khởi tạo, rồi loại bootstrap credentials trước khi chạy JVM.

Chạy frontend ở terminal khác:

```bash
cd frontend
npm ci
npm run dev
```

## Kiểm tra trước khi commit

```bash
cd frontend
npm run lint
npm run lint:contract
npm test
npm run build
npm run test:e2e
```

```bash
cd backend
./mvnw verify
```

```bash
docker compose --env-file .env.example -f infra/compose.yml config --quiet
docker compose --env-file .env.example -f infra/compose.prod.yml config --quiet
```

## Các vertical slice tiếp theo

1. Public market và biểu đồ OHLCV.
2. Identity, session và bảo mật tài khoản.
3. Watchlist.
4. Dashboard analytics và news.
5. Portfolio thủ công.
6. Hardening và public demo.

Quy ước kiến trúc, bảo mật và lộ trình học backend nằm trong thư mục
[`docs/`](docs/). Các giá trị trong `.env.example` chỉ dành cho local; không dùng
chúng làm secret production.
