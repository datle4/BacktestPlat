import { useQuery } from '@tanstack/react-query'
import { AlertCircle, BarChart3, CalendarDays, Check, Moon, RefreshCw, Sun, TrendingDown, TrendingUp } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'

import { getPriceSeries, getStocks, type PricePoint } from '@/api/marketData'
import { PriceChart } from '@/components/PriceChart'
import { type ThemePreference, usePreferencesStore } from '@/store/usePreferencesStore'

const DATA_CUTOFF = '2026-09-20'
const INITIAL_FROM = '2026-01-01'
const priceFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const decimalPriceFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
const compactFormatter = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('vi-VN', { signDisplay: 'always', maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+07:00`))
}

function summarize(prices: PricePoint[]) {
  const first = prices.at(0)
  const latest = prices.at(-1)
  const change = first && latest ? ((latest.close - first.close) / first.close) * 100 : 0
  return {
    latest,
    change,
    high: prices.length ? Math.max(...prices.map((price) => price.high)) : 0,
    averageVolume: prices.length ? prices.reduce((total, price) => total + price.volume, 0) / prices.length : 0,
  }
}

export function MarketOverview() {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const [symbolSelection, setSymbolSelection] = useState('')
  const [draftFrom, setDraftFrom] = useState(INITIAL_FROM)
  const [draftTo, setDraftTo] = useState(DATA_CUTOFF)
  const [range, setRange] = useState({ from: INITIAL_FROM, to: DATA_CUTOFF })

  const stocksQuery = useQuery({ queryKey: ['stocks'], queryFn: getStocks })
  const selectedSymbol = symbolSelection || stocksQuery.data?.[0]?.symbol || ''

  const pricesQuery = useQuery({
    queryKey: ['prices', selectedSymbol, range.from, range.to],
    queryFn: () => getPriceSeries(selectedSymbol, range.from, range.to),
    enabled: Boolean(selectedSymbol),
  })

  const selectedStock = stocksQuery.data?.find((stock) => stock.symbol === selectedSymbol)
  const prices = pricesQuery.data?.prices
  const summary = useMemo(() => summarize(prices ?? []), [prices])
  const recentPrices = (prices ?? []).slice(-12).reverse()
  const invalidRange = Boolean(draftFrom && draftTo && draftFrom > draftTo)

  function applyRange(event: FormEvent) {
    event.preventDefault()
    if (!invalidRange) setRange({ from: draftFrom, to: draftTo })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Bỏ qua tới nội dung chính</a>
      <header className="site-header" aria-label="Thanh điều hướng chính">
        <a className="brand" href="/" aria-label="BacktestPlat — Dữ liệu thị trường">
          <span className="brand-mark" aria-hidden="true"><BarChart3 size={21} /></span>
          <span><strong>BacktestPlat</strong><small>Dữ liệu & chiến lược</small></span>
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

      <main id="main-content" className="market-main" tabIndex={-1}>
        <section className="market-intro" aria-labelledby="market-title">
          <div>
            <h1 id="market-title">Dữ liệu thị trường</h1>
            <p>Theo dõi lịch sử giá và thanh khoản của nhóm cổ phiếu đang được dùng cho backtest.</p>
          </div>
          <div className="data-cutoff"><Check size={16} aria-hidden="true" /> Cố định đến 20/09/2026</div>
        </section>

        <form className="market-filters" onSubmit={applyRange} aria-label="Bộ lọc dữ liệu lịch sử">
          <label>
            <span>Mã cổ phiếu</span>
            <select value={selectedSymbol} onChange={(event) => setSymbolSelection(event.target.value)} disabled={stocksQuery.isPending || !stocksQuery.data?.length}>
              {stocksQuery.isPending ? <option>Đang tải danh sách…</option> : null}
              {stocksQuery.data?.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} · {stock.exchange}</option>)}
            </select>
          </label>
          <label>
            <span>Từ ngày</span>
            <input type="date" value={draftFrom} min="2021-01-01" max={DATA_CUTOFF} onChange={(event) => setDraftFrom(event.target.value)} required />
          </label>
          <label>
            <span>Đến ngày</span>
            <input type="date" value={draftTo} min="2021-01-01" max={DATA_CUTOFF} onChange={(event) => setDraftTo(event.target.value)} required />
          </label>
          <button type="submit" disabled={invalidRange || pricesQuery.isFetching}>
            <RefreshCw size={17} aria-hidden="true" /> {pricesQuery.isFetching ? 'Đang tải…' : 'Xem dữ liệu'}
          </button>
          {invalidRange ? <p className="filter-error" role="alert">Ngày bắt đầu phải trước ngày kết thúc.</p> : null}
        </form>

        {stocksQuery.isError || pricesQuery.isError ? (
          <section className="state-panel error-state" role="alert">
            <AlertCircle size={22} aria-hidden="true" />
            <div><h2>Chưa tải được dữ liệu</h2><p>{(stocksQuery.error ?? pricesQuery.error)?.message}. Kiểm tra backend rồi thử lại.</p></div>
          </section>
        ) : stocksQuery.isPending || (selectedSymbol && pricesQuery.isPending) ? (
          <section className="state-panel loading-state" aria-live="polite">
            <span className="loading-indicator" aria-hidden="true" />
            <div><h2>Đang đọc dữ liệu thị trường</h2><p>Kết nối tới PostgreSQL và chuẩn bị chuỗi giá.</p></div>
          </section>
        ) : !stocksQuery.data?.length ? (
          <section className="state-panel">
            <CalendarDays size={22} aria-hidden="true" />
            <div><h2>Chưa có dữ liệu lịch sử</h2><p>Chạy lệnh import Java trong README, sau đó tải lại trang.</p></div>
          </section>
        ) : pricesQuery.data && prices?.length === 0 ? (
          <section className="state-panel">
            <CalendarDays size={22} aria-hidden="true" />
            <div><h2>Không có phiên trong khoảng đã chọn</h2><p>Hãy mở rộng khoảng ngày để xem dữ liệu {selectedSymbol}.</p></div>
          </section>
        ) : pricesQuery.data && prices && summary.latest ? (
          <div className="market-content">
            <section className="instrument-heading" aria-labelledby="instrument-title">
              <div>
                <h2 id="instrument-title">{selectedSymbol}</h2>
                <p>{selectedStock?.name} · {selectedStock?.exchange}</p>
              </div>
              <p>{pricesQuery.data.count.toLocaleString('vi-VN')} phiên · {formatDate(pricesQuery.data.from)}–{formatDate(pricesQuery.data.to)}</p>
            </section>

            <dl className="market-stats">
              <div><dt>Đóng cửa gần nhất</dt><dd>{decimalPriceFormatter.format(summary.latest.close)} <small>₫</small></dd><dd className="stat-note">{formatDate(summary.latest.date)}</dd></div>
              <div><dt>Biến động kỳ</dt><dd className={summary.change >= 0 ? 'positive' : 'negative'}>{summary.change >= 0 ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}{percentFormatter.format(summary.change)}%</dd><dd className="stat-note">So với phiên đầu kỳ</dd></div>
              <div><dt>Cao nhất kỳ</dt><dd>{priceFormatter.format(summary.high)} <small>₫</small></dd><dd className="stat-note">Giá cao nhất trong phiên</dd></div>
              <div><dt>KL trung bình</dt><dd>{compactFormatter.format(summary.averageVolume)}</dd><dd className="stat-note">Cổ phiếu mỗi phiên</dd></div>
            </dl>

            <section className="chart-section" aria-labelledby="chart-heading">
              <div className="section-heading"><div><h2 id="chart-heading">Diễn biến giá đóng cửa</h2><p>Đơn vị: VND</p></div><span>{formatDate(summary.latest.date)}</span></div>
              <div className="chart-scroll" role="region" aria-label="Biểu đồ giá có thể cuộn ngang" tabIndex={0}><PriceChart prices={prices} symbol={selectedSymbol} /></div>
            </section>

            <section className="price-table-section" aria-labelledby="price-table-title">
              <div className="section-heading"><div><h2 id="price-table-title">12 phiên gần nhất</h2><p>Giá OHLC và khối lượng giao dịch</p></div></div>
              <div className="table-scroll" role="region" aria-label="Bảng giá có thể cuộn ngang" tabIndex={0}>
                <table>
                  <thead><tr><th>Ngày</th><th>Mở cửa</th><th>Cao</th><th>Thấp</th><th>Đóng cửa</th><th>Khối lượng</th></tr></thead>
                  <tbody>{recentPrices.map((price) => (
                    <tr key={price.date}>
                      <th scope="row">{formatDate(price.date)}</th>
                      <td>{decimalPriceFormatter.format(price.open)}</td>
                      <td>{decimalPriceFormatter.format(price.high)}</td>
                      <td>{decimalPriceFormatter.format(price.low)}</td>
                      <td className="close-cell">{decimalPriceFormatter.format(price.close)}</td>
                      <td>{price.volume.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </main>
      <footer className="site-footer"><span>BacktestPlat</span><span>Dữ liệu lịch sử cố định · Chưa mô phỏng giao dịch</span></footer>
    </div>
  )
}
