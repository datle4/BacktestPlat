import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Layers,
  TrendingUp,
} from 'lucide-react'
import { useMarket, compact, date, number } from '@/hooks/useMarket'
import { Change, DataState } from '@/components/PageParts'
import { PriceChart } from '@/components/PriceChart'

export function MarketHome() {
  const market = useMarket()
  const [selected, setSelected] = useState('')
  const [period, setPeriod] = useState('3M')
  const available = market.rows.filter((row) => row.latest)
  const latestDate = available
    .map((row) => row.latest!.date)
    .sort()
    .at(-1)
  const sameSession = available.filter((row) => row.latest?.date === latestDate)
  const volume = sameSession.reduce((sum, row) => sum + row.latest!.volume, 0)
  const advancing = sameSession.filter(
    (row) => row.change !== null && row.change > 0,
  ).length
  const declining = sameSession.filter(
    (row) => row.change !== null && row.change < 0,
  ).length
  const flat = sameSession.filter((row) => row.change === 0).length
  const selectedRow =
    available.find((row) => row.symbol === selected) ?? available[0]
  const endDate = selectedRow?.latest?.date
  const chartFrom = endDate ? new Date(`${endDate}T00:00:00Z`) : null
  if (chartFrom)
    chartFrom.setUTCMonth(chartFrom.getUTCMonth() - (period === '1M' ? 1 : 3))
  const chartPrices = (selectedRow?.prices ?? []).filter(
    (price) =>
      period === 'YTD' ||
      price.date >= (chartFrom?.toISOString().slice(0, 10) ?? ''),
  )
  const ranked = [...sameSession].sort(
    (a, b) => b.latest!.volume - a.latest!.volume,
  )
  const dates = [
    ...new Set(available.flatMap((row) => row.prices.map((bar) => bar.date))),
  ]
    .sort()
    .slice(-10)
  const volumes = dates.map((day) => ({
    day,
    total: available.reduce(
      (sum, row) =>
        sum + (row.prices.find((bar) => bar.date === day)?.volume ?? 0),
      0,
    ),
  }))
  const maxVolume = Math.max(...volumes.map((item) => item.total), 1)
  const ready = !market.pending && !market.failed && available.length > 0
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Nhịp thị trường</h1>
          <p>Một góc nhìn tổng quan, trước khi đi sâu vào từng cổ phiếu.</p>
        </div>
        <span className="snapshot">
          <CalendarDays size={15} aria-hidden="true" />
          {latestDate ? `Phiên ${date(latestDate)}` : 'Dữ liệu lịch sử'}
        </span>
      </div>
      <div className="scope-note">
        <span className="status-dot" />
        <span>
          Bộ theo dõi {market.rows.length || '—'} mã HOSE · Snapshot cố định đến
          20/09/2026
        </span>
        <span className="muted">Không phải số liệu toàn sàn</span>
      </div>
      <DataState
        pending={market.pending}
        failed={market.failed}
        empty={!available.length}
        retry={market.retry}
      />
      {ready && (
        <>
          <dl className="overview-stats">
            <div>
              <dt>
                <Layers size={17} aria-hidden="true" />
                Mã có dữ liệu cùng phiên
              </dt>
              <dd>
                {sameSession.length}
                <small> / {market.rows.length} mã</small>
              </dd>
              <dd className="stat-note">{latestDate && date(latestDate)}</dd>
            </div>
            <div>
              <dt>
                <BarChart3 size={17} aria-hidden="true" />
                Khối lượng giao dịch
              </dt>
              <dd>
                {compact.format(volume)}
                <small> CP</small>
              </dd>
              <dd className="stat-note">Tổng nhóm cùng phiên</dd>
            </div>
            <div>
              <dt>
                <TrendingUp size={17} aria-hidden="true" />
                Độ rộng nhóm theo dõi
              </dt>
              <dd>
                <span className="positive">{advancing} tăng</span>
                <small> / </small>
                <span className="negative">{declining} giảm</span>
              </dd>
              <dd className="stat-note">
                {flat} đứng giá ·{' '}
                {sameSession.filter((row) => row.change === null).length} chưa
                có đối chiếu
              </dd>
            </div>
          </dl>
          <div className="dashboard-grid">
            <section className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Diễn biến giá</h2>
                  <p>Giá đóng cửa · VND</p>
                </div>
                <div className="segmented" aria-label="Khoảng thời gian">
                  {['1M', '3M', 'YTD'].map((item) => (
                    <button
                      key={item}
                      aria-pressed={period === item}
                      onClick={() => setPeriod(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="symbol-tabs" aria-label="Chọn mã biểu đồ">
                {available.map((row) => (
                  <button
                    key={row.symbol}
                    aria-pressed={selectedRow?.symbol === row.symbol}
                    onClick={() => setSelected(row.symbol)}
                  >
                    {row.symbol}
                  </button>
                ))}
              </div>
              {selectedRow?.latest && (
                <>
                  <div className="chart-value">
                    <strong>
                      {number.format(selectedRow.latest.close)}
                      <small> ₫</small>
                    </strong>
                    <Change value={selectedRow.change} />
                    <span className="muted">so với phiên trước có dữ liệu</span>
                  </div>
                  <PriceChart
                    prices={chartPrices}
                    symbol={selectedRow.symbol}
                  />
                </>
              )}
              <div className="panel-foot">
                <span>Nguồn: Yahoo Finance · Giá lịch sử theo nguồn</span>
                <Link to={`/stocks?symbol=${selectedRow?.symbol ?? ''}`}>
                  Xem chi tiết <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </section>
            <section className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Giao dịch sôi động</h2>
                  <p>Top 5 khối lượng cùng phiên</p>
                </div>
                <BarChart3 size={19} aria-hidden="true" />
              </div>
              <ol className="ranking">
                {ranked.slice(0, 5).map((row, index) => (
                  <li key={row.symbol}>
                    <span className="rank">{index + 1}</span>
                    <Link to={`/stocks?symbol=${row.symbol}`}>
                      <strong>{row.symbol}</strong>
                      <small>{row.name}</small>
                    </Link>
                    <div>
                      <strong>{compact.format(row.latest!.volume)} CP</strong>
                      <Change value={row.change} />
                    </div>
                  </li>
                ))}
              </ol>
              <Link className="panel-link" to="/stocks">
                Khám phá danh sách cổ phiếu{' '}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Thanh khoản qua các phiên</h2>
                  <p>Tổng khối lượng các mã có dữ liệu mỗi ngày</p>
                </div>
              </div>
              <figure className="volume-figure">
                <div className="volume-bars">
                  {volumes.map(({ day, total }) => (
                    <div key={day}>
                      <span className="volume-value">
                        {compact.format(total)}
                      </span>
                      <div className="bar-track">
                        <div
                          className="volume-bar"
                          style={{ height: `${(total / maxVolume) * 100}%` }}
                        />
                      </div>
                      <span>
                        {day.slice(8)}/{day.slice(5, 7)}
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption>
                  10 ngày gần nhất có dữ liệu · Đơn vị: cổ phiếu
                </figcaption>
              </figure>
            </section>
            <section className="panel insights">
              <div className="panel-heading">
                <div>
                  <h2>Điểm đáng chú ý</h2>
                  <p>Tổng hợp từ bộ dữ liệu đang theo dõi</p>
                </div>
              </div>
              <article>
                <span className="insight-icon">
                  <TrendingUp size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>{ranked[0]?.symbol} dẫn đầu khối lượng</h3>
                  <p>
                    {ranked[0] && compact.format(ranked[0].latest!.volume)} cổ
                    phiếu trong phiên {latestDate && date(latestDate)}.
                  </p>
                </div>
              </article>
              <article>
                <span className="insight-icon">
                  <Layers size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>
                    {advancing} mã tăng, {declining} mã giảm
                  </h3>
                  <p>
                    So với phiên trước có dữ liệu của từng mã. Chỉ phản ánh nhóm
                    cổ phiếu đang theo dõi.
                  </p>
                </div>
              </article>
              <div className="insight-note">
                Số liệu lịch sử phục vụ nghiên cứu. Không cập nhật giá trực tiếp
                hoặc tin tức tự động.
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}
