# BacktestPlat frontend

React + TypeScript + Vite. Trang dữ liệu thị trường đọc danh sách cổ phiếu và OHLCV lịch sử từ backend.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. API requests under `/api` will proxy to localhost:8080.

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Trang dữ liệu hỗ trợ chọn mã và khoảng ngày, biểu đồ giá đóng cửa, thống kê nhanh,
bảng 12 phiên gần nhất, theme sáng/tối/hệ thống và đầy đủ trạng thái tải/lỗi/rỗng.
End-to-end tests cover 375/768/1024/1440px, reduced motion and automated accessibility checks.
See the [root README](../README.md) for Docker PostgreSQL and backend instructions.
