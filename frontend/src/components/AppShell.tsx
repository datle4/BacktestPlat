import {
  Activity,
  ArrowUpRight,
  FlaskConical,
  LayoutDashboard,
  List,
  Moon,
  Sun,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import {
  usePreferencesStore,
  type ThemePreference,
} from '@/store/usePreferencesStore'

const links = [
  { to: '/', title: 'Thị trường', icon: LayoutDashboard },
  { to: '/stocks', title: 'Cổ phiếu', icon: List },
  { to: '/backtest', title: 'Backtest', icon: FlaskConical },
]

export function AppShell() {
  const { pathname } = useLocation()
  const lastPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)
  const { theme, setTheme } = usePreferencesStore()
  useEffect(() => {
    document.title = `${links.find((item) => item.to === pathname)?.title ?? 'Cổ phiếu'} · BacktestPlat`
    if (lastPath.current !== pathname) {
      main.current?.focus()
      window.scrollTo(0, 0)
      lastPath.current = pathname
    }
  }, [pathname])
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="BacktestPlat — Trang chủ">
          <span className="brand-mark">
            <Activity size={23} aria-hidden="true" />
          </span>
          <span>
            Backtest<span className="brand-light">Plat</span>
            <small>Không gian nghiên cứu</small>
          </span>
        </NavLink>
        <nav aria-label="Điều hướng chính">
          {links.map(({ to, title, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
            >
              <Icon size={19} aria-hidden="true" />
              <span>{title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="status-dot" />
            Dữ liệu lịch sử
            <p>
              Khám phá thị trường.
              <br />
              Kiểm chứng ý tưởng.
            </p>
          </div>
          <a
            className="guide-link"
            href="https://github.com/datle4/BacktestPlat#readme"
            target="_blank"
            rel="noreferrer"
          >
            Hướng dẫn sử dụng <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <span>
            Nghiên cứu cổ phiếu <span className="topbar-divider">/</span>{' '}
            <strong>
              {links.find((item) => item.to === pathname)?.title ?? 'Cổ phiếu'}
            </strong>
          </span>
          <label className="theme-control">
            {theme === 'dark' ? (
              <Moon size={16} aria-hidden="true" />
            ) : (
              <Sun size={16} aria-hidden="true" />
            )}
            <span className="sr-only">Giao diện</span>
            <select
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as ThemePreference)
              }
            >
              <option value="system">Hệ thống</option>
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </label>
        </header>
        <main id="main-content" className="page" tabIndex={-1} ref={main}>
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>BacktestPlat · Không gian nghiên cứu của bạn</span>
          <span>Snapshot đến 20/09/2026</span>
        </footer>
      </div>
    </div>
  )
}
