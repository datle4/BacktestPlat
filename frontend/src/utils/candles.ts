import type { PricePoint } from '@/api/marketData'

export type CandleInterval = '1D' | '1W' | '1M' | '1Y'
export interface Candle extends PricePoint {
  period: string
  endDate: string
  sessions: number
}
export const candleIntervals: { value: CandleInterval; label: string }[] = [
  { value: '1D', label: 'ngày' },
  { value: '1W', label: 'tuần' },
  { value: '1M', label: 'tháng' },
  { value: '1Y', label: 'năm' },
]

function periodKey(day: string, interval: CandleInterval) {
  if (interval === '1Y') return day.slice(0, 4)
  if (interval === '1M') return day.slice(0, 7)
  if (interval === '1D') return day
  // API dates are calendar dates. UTC keeps Monday buckets timezone-independent.
  const monday = new Date(`${day}T00:00:00Z`)
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

export function aggregateCandles(
  prices: PricePoint[],
  interval: CandleInterval,
): Candle[] {
  const candles: Candle[] = []
  for (const bar of [...prices].sort((a, b) => a.date.localeCompare(b.date))) {
    const period = periodKey(bar.date, interval)
    const previous = candles.at(-1)
    if (previous?.period === period) {
      previous.high = Math.max(previous.high, bar.high)
      previous.low = Math.min(previous.low, bar.low)
      previous.close = bar.close
      previous.volume += bar.volume
      previous.endDate = bar.date
      previous.sessions += 1
    } else {
      candles.push({ ...bar, period, endDate: bar.date, sessions: 1 })
    }
  }
  return candles
}
