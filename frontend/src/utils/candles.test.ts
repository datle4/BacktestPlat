import { describe, expect, it } from 'vitest'
import type { PricePoint } from '@/api/marketData'
import { aggregateCandles } from './candles'

const bar = (
  date: string,
  open: number,
  close: number,
  volume = 10,
): PricePoint => ({
  date,
  open,
  close,
  high: Math.max(open, close) + 5,
  low: Math.min(open, close) - 5,
  volume,
})

describe('historical candle aggregation', () => {
  it('retains daily OHLCV, sorts dates and never mutates source data', () => {
    const input = [bar('2026-01-06', 100, 90), bar('2026-01-05', 90, 110)]
    const before = structuredClone(input)
    expect(aggregateCandles(input, '1D')).toEqual([
      { ...input[1], period: '2026-01-05', endDate: '2026-01-05', sessions: 1 },
      { ...input[0], period: '2026-01-06', endDate: '2026-01-06', sessions: 1 },
    ])
    aggregateCandles(input, '1W')
    expect(input).toEqual(before)
  })

  it('uses Monday weeks across year boundaries and retains partial weeks', () => {
    const input = [
      bar('2025-12-31', 100, 110, 20),
      bar('2026-01-02', 120, 90, 30),
      bar('2026-01-04', 95, 105, 40),
      bar('2026-01-05', 105, 115, 50),
    ]
    expect(aggregateCandles(input, '1W')).toEqual([
      {
        date: '2025-12-31',
        endDate: '2026-01-04',
        period: '2025-12-29',
        open: 100,
        high: 125,
        low: 85,
        close: 105,
        volume: 90,
        sessions: 3,
      },
      { ...input[3], endDate: '2026-01-05', period: '2026-01-05', sessions: 1 },
    ])
  })

  it('keeps months and years separate, without inventing bars for missing periods', () => {
    const input = [
      bar('2025-01-15', 80, 90),
      bar('2025-12-31', 100, 110),
      bar('2026-01-02', 120, 90),
      bar('2026-01-30', 95, 105),
    ]
    const monthly = aggregateCandles(input, '1M')
    expect(monthly.map((item) => item.period)).toEqual([
      '2025-01',
      '2025-12',
      '2026-01',
    ])
    expect(monthly[2]).toMatchObject({
      open: 120,
      close: 105,
      high: 125,
      low: 85,
      volume: 20,
      sessions: 2,
    })
    expect(aggregateCandles(input, '1Y')).toEqual([
      {
        date: '2025-01-15',
        endDate: '2025-12-31',
        period: '2025',
        open: 80,
        close: 110,
        high: 115,
        low: 75,
        volume: 20,
        sessions: 2,
      },
      {
        date: '2026-01-02',
        endDate: '2026-01-30',
        period: '2026',
        open: 120,
        close: 105,
        high: 125,
        low: 85,
        volume: 20,
        sessions: 2,
      },
    ])
  })

  it('handles empty and flat single-session series', () => {
    expect(aggregateCandles([], '1Y')).toEqual([])
    const flat = {
      date: '2026-01-05',
      open: 100,
      close: 100,
      high: 100,
      low: 100,
      volume: 0,
    }
    expect(aggregateCandles([flat], '1M')).toEqual([
      { ...flat, period: '2026-01', endDate: flat.date, sessions: 1 },
    ])
  })
})
