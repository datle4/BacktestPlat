import { useId, useState } from 'react'
import type { EquityPoint } from '@/api/backtests'
import { date, number } from '@/hooks/useMarket'

export function EquityChart({
  points,
  capital,
}: {
  points: EquityPoint[]
  capital: number
}) {
  const id = useId()
  const [selected, setSelected] = useState(points.length - 1)
  if (!points.length) return <p>Chưa có giá trị tài khoản.</p>
  const index = Math.min(selected, points.length - 1)
  const point = points[index]
  const values = points.map((p) => p.equity)
  const minimum = Math.min(capital, ...values)
  const maximum = Math.max(capital, ...values)
  const pad = Math.max((maximum - minimum) * 0.12, capital * 0.005)
  const low = minimum - pad
  const high = maximum + pad
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * 100
  const y = (value: number) => 100 - ((value - low) / (high - low)) * 100
  const line = points.map((p, i) => `${x(i)},${y(p.equity)}`).join(' ')
  return (
    <div className="equity-chart">
      <div
        className="equity-readout"
        role="group"
        aria-label="Giá trị tài khoản theo phiên"
      >
        <span>{date(point.date)}</span>
        <strong>{number.format(point.equity)} ₫</strong>
        <span>Sụt giảm: {number.format(point.drawdownPercent)}%</span>
      </div>
      <figure
        className="price-figure"
        role="img"
        aria-label={`Đường vốn từ ${date(points[0].date)} đến ${date(points.at(-1)!.date)}, cuối kỳ ${number.format(points.at(-1)!.equity)} đồng`}
      >
        <div className="chart-axes" aria-hidden="true">
          <div className="y-labels">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>
                {number.format(high - ((high - low) * i) / 4)}
              </span>
            ))}
          </div>
          <div
            className="chart-plot"
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              setSelected(
                Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    Math.round(
                      ((event.clientX - box.left) / box.width) *
                        (points.length - 1),
                    ),
                  ),
                ),
              )
            }}
          >
            <svg
              className="price-chart"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--accent)"
                    stopOpacity=".2"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent-secondary)"
                    stopOpacity=".02"
                  />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${line} 100,100`}
                fill={`url(#${id}-fill)`}
              />
              <line
                x1="0"
                x2="100"
                y1={y(capital)}
                y2={y(capital)}
                stroke="var(--muted)"
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                className="chart-line"
                points={line}
                stroke="var(--accent)"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={x(index)}
                x2={x(index)}
                y1="0"
                y2="100"
                stroke="var(--muted)"
                strokeOpacity=".6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
        <div className="x-labels" aria-hidden="true">
          <span>{date(points[0].date)}</span>
          <span>{date(points.at(-1)!.date)}</span>
        </div>
      </figure>
      <div className="equity-legend">
        <span>
          <i />
          Giá trị tài khoản
        </span>
        <span>
          <i />
          Vốn ban đầu: {number.format(capital)} ₫
        </span>
      </div>
      <label className="equity-inspector">
        Chọn phiên để xem chi tiết
        <input
          type="range"
          min="0"
          max={points.length - 1}
          value={index}
          onChange={(e) => setSelected(Number(e.target.value))}
          aria-valuetext={`${date(point.date)}, ${number.format(point.equity)} đồng`}
        />
      </label>
      <dl className="equity-breakdown">
        <div>
          <dt>Tiền mặt</dt>
          <dd>{number.format(point.cash)} ₫</dd>
        </div>
        <div>
          <dt>Đang giữ</dt>
          <dd>{number.format(point.quantity)} CP</dd>
        </div>
        <div>
          <dt>Giá trị cổ phiếu</dt>
          <dd>{number.format(point.marketValue)} ₫</dd>
        </div>
      </dl>
    </div>
  )
}
