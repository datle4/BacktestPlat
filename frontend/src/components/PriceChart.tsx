import { useId } from 'react'
import type { PricePoint } from '@/api/marketData'
import { date, number } from '@/hooks/useMarket'

export function PriceChart({
  prices,
  symbol,
}: {
  prices: PricePoint[]
  symbol: string
}) {
  const id = useId()
  if (!prices.length)
    return <p className="empty-search">Không có giá trong khoảng này.</p>
  const minimum = Math.min(...prices.map((bar) => bar.close))
  const maximum = Math.max(...prices.map((bar) => bar.close))
  const padding = Math.max((maximum - minimum) * 0.15, maximum * 0.005, 1)
  const low = minimum - padding
  const high = maximum + padding
  const x = (index: number) =>
    prices.length === 1 ? 50 : (index / (prices.length - 1)) * 100
  const y = (value: number) => 100 - ((value - low) / (high - low)) * 100
  const points = prices
    .map((bar, index) => `${x(index)},${y(bar.close)}`)
    .join(' ')
  const last = prices[prices.length - 1]
  return (
    <figure
      className="price-figure"
      role="img"
      aria-labelledby={`${id}-title ${id}-description`}
    >
      <figcaption className="sr-only" id={`${id}-title`}>
        Giá đóng cửa {symbol}
      </figcaption>
      <p className="sr-only" id={`${id}-description`}>
        Từ {date(prices[0].date)} đến {date(last.date)}, thấp nhất{' '}
        {number.format(minimum)} và cao nhất {number.format(maximum)} đồng. Giá
        cuối kỳ {number.format(last.close)} đồng.
      </p>
      <div className="chart-axes" aria-hidden="true">
        <div className="y-labels">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i}>{number.format(high - ((high - low) * i) / 4)}</span>
          ))}
        </div>
        <div className="chart-plot">
          <div className="chart-grid-lines">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} />
            ))}
          </div>
          <svg
            className="price-chart"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18" />
                <stop
                  offset="100%"
                  stopColor="var(--accent)"
                  stopOpacity=".01"
                />
              </linearGradient>
            </defs>
            {prices.length > 1 && (
              <polygon
                points={`0,100 ${points} 100,100`}
                fill={`url(#${id}-fill)`}
              />
            )}
            {prices.length > 1 ? (
              <polyline
                className="chart-line"
                points={points}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <line
                className="chart-line"
                x1="48"
                x2="52"
                y1={y(last.close)}
                y2={y(last.close)}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </div>
      </div>
      <div className="x-labels" aria-hidden="true">
        <span>{date(prices[0].date)}</span>
        <span>{date(last.date)}</span>
      </div>
    </figure>
  )
}
