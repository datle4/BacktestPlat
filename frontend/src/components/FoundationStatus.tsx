import { ArrowUpRight, ChartNoAxesCombined, Check, Moon, Sun } from 'lucide-react'

import {
  type ThemePreference,
  usePreferencesStore,
} from '@/store/usePreferencesStore'

const stages = [
  { title: 'Dữ liệu thị trường', description: 'Lưu cổ phiếu và giá OHLCV theo từng phiên, cập nhật dữ liệu hằng ngày.' },
  { title: 'Tín hiệu & mô phỏng', description: 'Nhận BUY / SELL / HOLD từ Quant, khớp lệnh tại giá mở cửa của phiên tiếp theo.' },
  { title: 'Kết quả & đánh giá', description: 'Theo dõi tiền mặt, vị thế, hiệu suất, đường vốn và lịch sử giao dịch.' },
]

export function FoundationStatus() {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)

  return (
    <div className="foundation-shell">
      <a className="skip-link" href="#main-content">Bỏ qua tới nội dung chính</a>
      <header className="site-header" aria-label="Thanh điều hướng chính">
        <a className="brand" href="/" aria-label="BacktestPlat — Trang chủ">
          <span className="brand-mark" aria-hidden="true"><ChartNoAxesCombined size={21} /></span>
          <span><strong>BacktestPlat</strong><small>Kiểm thử chiến lược</small></span>
        </a>
        <label className="theme-control" htmlFor="theme-select">
          {theme === 'dark' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          <span>Giao diện</span>
          <select id="theme-select" value={theme} onChange={(event) => setTheme(event.target.value as ThemePreference)}>
            <option value="system">Theo hệ thống</option>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>
      </header>

      <main id="main-content" className="foundation-main" tabIndex={-1}>
        <section className="status-hero" aria-labelledby="foundation-title">
          <h1 id="foundation-title">Nền tảng backtest cổ phiếu.</h1>
          <p className="hero-summary">Một không gian để kiểm chứng chiến lược bằng dữ liệu lịch sử,
            từ tín hiệu giao dịch đến diễn biến danh mục.</p>
          <p className="setup-state" role="status">
            <Check size={18} aria-hidden="true" /> Màn hình nền đã sẵn sàng
          </p>
          <p className="setup-note">Dự án đang ở bước thiết lập. Chưa có dữ liệu thị trường hoặc chức năng chạy backtest.</p>
        </section>

        <section className="roadmap" aria-labelledby="roadmap-title">
          <div className="section-heading">
            <h2 id="roadmap-title">Phạm vi MVP dự kiến</h2>
            <span>Chưa triển khai</span>
          </div>
          <ol className="stage-list">
            {stages.map(({ title, description }, index) => (
              <li key={title}>
                <span className="stage-number" aria-hidden="true">0{index + 1}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="project-note" aria-labelledby="next-step-title">
          <div>
            <h2 id="next-step-title">Bước tiếp theo: lưu trữ cổ phiếu</h2>
            <p>Các tính năng sẽ được phát triển lần lượt sau khi thống nhất mô hình code.</p>
          </div>
          <a className="text-link" href="https://github.com/datle4/BacktestPlat#readme">
            Hướng dẫn dự án <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </aside>
      </main>
      <footer className="site-footer"><span>BacktestPlat</span><span>Bản nền tảng · Chưa mô phỏng giao dịch</span></footer>
    </div>
  )
}
