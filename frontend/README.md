# BacktestPlat frontend

React + TypeScript + Vite. Ba trang dùng dữ liệu OHLCV lịch sử từ backend Java.

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

- `/`: tổng quan nhóm cổ phiếu, khối lượng, độ rộng, top 5 giao dịch và biểu đồ giá.
- `/stocks`: tìm kiếm, sắp xếp và lịch sử giá theo khoảng ngày; `/stocks?symbol=FPT` mở chi tiết.
- `/backtest`: lưu/khôi phục cấu hình nháp bằng localStorage; chưa có engine hoặc kết quả mô phỏng.

Inter Variable tự host hỗ trợ tiếng Việt; theme sáng/tối/hệ thống, bàn phím và trạng thái tải/lỗi/rỗng.
Các thống kê chỉ phản ánh nhóm mã đã nhập, không phải chỉ số toàn sàn.
End-to-end tests cover 375/768/1024/1440px, reduced motion and automated accessibility checks.
See the [root README](../README.md) for Docker PostgreSQL and backend instructions.
