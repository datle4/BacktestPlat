import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus } from 'lucide-react'
import { lazy, Suspense, useId, useMemo, useRef, useState } from 'react'
import type { PricePoint } from '@/api/marketData'
import { date, number } from '@/hooks/useMarket'
import type {
  ChartViewport,
  TradingChartHandle,
} from '@/components/TradingChart'
import {
  aggregateCandles,
  candleIntervals,
  type Candle,
  type CandleInterval,
} from '@/utils/candles'

const TradingChart = lazy(() =>
  import('@/components/TradingChart').then((module) => ({
    default: module.TradingChart,
  })),
)

export function CandlestickChart({
  prices,
  symbol,
}: {
  prices: PricePoint[]
  symbol: string
}) {
  const [interval, setInterval] = useState<CandleInterval>('1D')
  const candles = useMemo(
    () => aggregateCandles(prices, interval),
    [prices, interval],
  )
  return (
    <div className="candlestick-chart">
      <div className="candle-toolbar">
        <div className="candle-intervals" role="group" aria-label="Khung nến">
          {candleIntervals.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              title={`Một nến mỗi ${label}`}
              onClick={() => setInterval(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <span className="candle-unit">
          1 nến = 1{' '}
          {candleIntervals.find((item) => item.value === interval)!.label} · VND
        </span>
      </div>
      {candles.length > 0 && (
        <CandlePlot
          key={`${interval}-${prices[0]?.date}-${prices.at(-1)?.date}-${prices.length}`}
          candles={candles}
          symbol={symbol}
          interval={interval}
        />
      )}
      <p className="candle-note">
        {interval === '1D'
          ? 'Chỉ hiển thị các phiên có dữ liệu.'
          : 'Nến được gộp từ các phiên có dữ liệu trong khoảng ngày đã chọn; nến đầu/cuối có thể chưa đủ kỳ.'}
        {interval === '1Y' &&
          candles.length < 2 &&
          ' Mở rộng “Từ ngày” để so sánh nhiều năm.'}
      </p>
      <small className="chart-credit">
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
          TradingView Lightweight Charts™
        </a>{' '}
        · Copyright (с) 2025 TradingView, Inc.
      </small>
    </div>
  )
}

function CandlePlot({
  candles,
  symbol,
  interval,
}: {
  candles: Candle[]
  symbol: string
  interval: CandleInterval
}) {
  const id = useId()
  const chart = useRef<TradingChartHandle>(null)
  const [activeIndex, setActiveIndex] = useState(candles.length - 1)
  const [viewport, setViewport] = useState<ChartViewport>({
    from: 0,
    to: candles.length - 1,
  })
  const active = candles[Math.min(activeIndex, candles.length - 1)]
  const direction =
    active.close > active.open
      ? '↑ Tăng'
      : active.close < active.open
        ? '↓ Giảm'
        : '— Không đổi'
  const coverage =
    active.date === active.endDate
      ? date(active.date)
      : `${date(active.date)} – ${date(active.endDate)}`
  const change = active.open ? (active.close / active.open - 1) * 100 : 0
  return (
    <>
      <div className="candle-readout" role="group" aria-label="Thông tin nến">
        <div className="candle-session">
          <strong>
            {symbol} <span className="muted">· {interval}</span>
          </strong>
          <span>
            {coverage} · {active.sessions} phiên
          </span>
          <span
            className={active.close >= active.open ? 'positive' : 'negative'}
          >
            {direction} {change >= 0 ? '+' : ''}
            {number.format(change)}%
          </span>
        </div>
        <dl>
          {[
            ['Mở', active.open],
            ['Cao', active.high],
            ['Thấp', active.low],
            ['Đóng', active.close],
            ['Khối lượng', active.volume],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{number.format(Number(value))}</dd>
            </div>
          ))}
        </dl>
      </div>
      <figure>
        <div
          className="trading-chart"
          role="img"
          aria-label={`Biểu đồ nến ${symbol} ${interval}`}
          aria-describedby={`${id}-description`}
        >
          <Suspense
            fallback={<span className="muted">Đang dựng biểu đồ…</span>}
          >
            <TradingChart
              ref={chart}
              candles={candles}
              onInspect={setActiveIndex}
              onViewport={setViewport}
            />
          </Suspense>
          <span className="volume-pane-label" aria-hidden="true">
            Khối lượng · CP
          </span>
        </div>
        <figcaption id={`${id}-description`} className="candle-chart-hint">
          Kéo để xem lịch sử · Cuộn hoặc chụm để thu phóng · Giữ chạm để xem giá
        </figcaption>
      </figure>
      <div className="candle-footer">
        <span>
          {candles.length} nến · Đang xem{' '}
          {Math.max(0, viewport.to - viewport.from + 1)}
        </span>
        <div
          className="candle-paging"
          role="group"
          aria-label="Điều hướng biểu đồ"
        >
          <button
            type="button"
            disabled={viewport.from <= 0}
            onClick={() => chart.current?.pan(-1)}
            aria-label="Xem lịch sử cũ hơn"
            title="Xem lịch sử cũ hơn"
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => chart.current?.zoom(1.4)}
            aria-label="Thu nhỏ biểu đồ"
            title="Thu nhỏ"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => chart.current?.zoom(0.7)}
            aria-label="Phóng to biểu đồ"
            title="Phóng to"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              chart.current?.reset()
              setActiveIndex(candles.length - 1)
            }}
            aria-label="Đặt lại biểu đồ"
            title="Đặt lại"
          >
            <Maximize2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={viewport.to >= candles.length - 1}
            onClick={() => chart.current?.pan(1)}
            aria-label="Xem lịch sử mới hơn"
            title="Xem lịch sử mới hơn"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <details className="candle-data">
        <summary>Xem dữ liệu từng nến</summary>
        <div className="candle-inspector">
          <label htmlFor={`${id}-inspect`}>Chọn nến</label>
          <input
            id={`${id}-inspect`}
            type="range"
            min={0}
            max={candles.length - 1}
            step={1}
            value={activeIndex}
            disabled={candles.length === 1}
            aria-valuetext={`${coverage}. ${direction}. Mở ${number.format(active.open)}, cao ${number.format(active.high)}, thấp ${number.format(active.low)}, đóng ${number.format(active.close)}. Khối lượng ${number.format(active.volume)}.`}
            onChange={(event) => {
              const index = Number(event.target.value)
              setActiveIndex(index)
              chart.current?.inspect(index)
            }}
          />
        </div>
        <p className="candle-note">
          Chọn bằng thanh kéo hoặc phím mũi tên để xem giá và khối lượng ở phía
          trên.
        </p>
      </details>
    </>
  )
}
