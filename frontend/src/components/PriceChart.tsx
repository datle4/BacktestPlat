import type { PricePoint } from '@/api/marketData'

const WIDTH = 920
const HEIGHT = 320
const PADDING = { top: 22, right: 24, bottom: 38, left: 72 }

const priceFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+07:00`))
}

export function PriceChart({ prices, symbol }: { prices: PricePoint[]; symbol: string }) {
  const closes = prices.map((price) => price.close)
  const minimum = Math.min(...closes)
  const maximum = Math.max(...closes)
  const spread = maximum - minimum || Math.max(maximum * 0.02, 1)
  const chartWidth = WIDTH - PADDING.left - PADDING.right
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
  const x = (index: number) => PADDING.left + (index / Math.max(prices.length - 1, 1)) * chartWidth
  const y = (value: number) => PADDING.top + ((maximum - value) / spread) * chartHeight
  const points = prices.map((price, index) => `${x(index)},${y(price.close)}`).join(' ')
  const area = `${PADDING.left},${PADDING.top + chartHeight} ${points} ${PADDING.left + chartWidth},${PADDING.top + chartHeight}`
  const gridValues = Array.from({ length: 5 }, (_, index) => maximum - (spread * index) / 4)
  const first = prices.at(0)
  const last = prices.at(-1)

  return (
    <svg className="price-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="chart-title chart-description">
      <title id="chart-title">Giá đóng cửa {symbol}</title>
      <desc id="chart-description">
        Từ {first ? formatDate(first.date) : ''} đến {last ? formatDate(last.date) : ''}, thấp nhất {priceFormatter.format(minimum)} và cao nhất {priceFormatter.format(maximum)} đồng.
      </desc>
      {gridValues.map((value, index) => {
        const gridY = PADDING.top + (chartHeight * index) / 4
        return (
          <g key={value} aria-hidden="true">
            <line className="chart-grid" x1={PADDING.left} x2={PADDING.left + chartWidth} y1={gridY} y2={gridY} />
            <text className="chart-label" x={PADDING.left - 12} y={gridY + 4} textAnchor="end">{priceFormatter.format(value)}</text>
          </g>
        )
      })}
      <polygon className="chart-area" points={area} aria-hidden="true" />
      <polyline className="chart-line" points={points} aria-hidden="true" />
      {first && last ? (
        <g aria-hidden="true">
          <text className="chart-label" x={PADDING.left} y={HEIGHT - 10}>{formatDate(first.date)}</text>
          <text className="chart-label" x={PADDING.left + chartWidth} y={HEIGHT - 10} textAnchor="end">{formatDate(last.date)}</text>
          <circle className="chart-endpoint" cx={x(prices.length - 1)} cy={y(last.close)} r="5" />
        </g>
      ) : null}
    </svg>
  )
}
