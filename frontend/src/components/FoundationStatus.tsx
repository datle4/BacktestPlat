import {
  Blocks,
  Check,
  CircleDot,
  Database,
  ExternalLink,
  Moon,
  Route,
  ServerCog,
  Sun,
} from 'lucide-react'

import {
  type ThemePreference,
  usePreferencesStore,
} from '@/store/usePreferencesStore'

const foundations = [
  {
    icon: Blocks,
    title: 'React + TypeScript',
    description: 'Vite và cấu hình kiểm tra kiểu nghiêm ngặt đã sẵn sàng.',
  },
  {
    icon: Route,
    title: 'Router + Query',
    description: 'Điều hướng và lớp quản lý server state đã được kết nối.',
  },
  {
    icon: Database,
    title: 'API cùng origin',
    description: 'Các yêu cầu /api sẽ được chuyển tiếp tới backend khi phát triển.',
  },
] as const

const themeOptions: Array<{
  value: ThemePreference
  label: string
}> = [
  { value: 'system', label: 'Theo hệ thống' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
]

export function FoundationStatus() {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)

  return (
    <div className="foundation-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>

      <header className="site-header" aria-label="Thanh điều hướng chính">
        <a className="brand" href="/" aria-label="VN Stock Dashboard — Trang chủ">
          <span className="brand-mark" aria-hidden="true">
            <CircleDot size={20} strokeWidth={2} />
          </span>
          <span>
            <strong>VN Stock</strong>
            <small>Dashboard</small>
          </span>
        </a>

        <label className="theme-control" htmlFor="theme-select">
          {theme === 'dark' ? (
            <Moon size={17} aria-hidden="true" />
          ) : (
            <Sun size={17} aria-hidden="true" />
          )}
          <span>Giao diện</span>
          <select
            id="theme-select"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemePreference)}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main id="main-content" className="foundation-main" tabIndex={-1}>
        <section className="status-hero" aria-labelledby="foundation-title">
          <div className="eyebrow">
            <span className="status-pulse" aria-hidden="true" />
            Chặng 0 · Nền tảng sẵn sàng
          </div>
          <p className="hero-kicker">Hạ tầng frontend</p>
          <h1 id="foundation-title">Một nền móng rõ ràng cho dữ liệu thị trường.</h1>
          <p className="hero-summary">
            VN Stock Dashboard đã có cấu trúc React, lớp provider và hệ thống giao diện
            sáng/tối. Các tính năng thị trường sẽ được phát triển lần lượt theo contract.
          </p>

          <div className="status-row" role="status" aria-live="polite">
            <Check size={18} aria-hidden="true" />
            <span>Frontend khởi tạo thành công</span>
            <span className="status-divider" aria-hidden="true" />
            <span className="status-detail">Không sử dụng dữ liệu giao dịch thật</span>
          </div>
        </section>

        <section className="foundation-grid" aria-labelledby="foundation-grid-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Trạng thái hệ thống</p>
              <h2 id="foundation-grid-title">Các khối nền tảng</h2>
            </div>
            <span className="readiness-badge">
              <Check size={15} aria-hidden="true" /> 3/3 hoạt động
            </span>
          </div>

          <div className="foundation-cards">
            {foundations.map(({ icon: Icon, title, description }, index) => (
              <article className="foundation-card" key={title}>
                <div className="card-icon" aria-hidden="true">
                  <Icon size={21} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="card-index">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span className="card-state">
                  <Check size={14} aria-hidden="true" /> Sẵn sàng
                </span>
              </article>
            ))}
          </div>
        </section>

        <aside className="next-step" aria-labelledby="next-step-title">
          <div className="next-step-icon" aria-hidden="true">
            <ServerCog size={22} />
          </div>
          <div>
            <p className="section-kicker">Bước tiếp theo</p>
            <h2 id="next-step-title">Kết nối contract OpenAPI</h2>
            <p>
              Màn hình thị trường sẽ được triển khai sau khi endpoint public đầu tiên được
              thống nhất giữa frontend và backend.
            </p>
          </div>
          <a className="text-link" href="/status">
            Xem trạng thái
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </aside>
      </main>

      <footer className="site-footer">
        <span>VN Stock Dashboard</span>
        <span>Dữ liệu minh họa · Không phải khuyến nghị đầu tư</span>
      </footer>
    </div>
  )
}

