import { useQueries, useQuery } from '@tanstack/react-query'
import { getPriceSeries, getStocks } from '@/api/marketData'

export const CUTOFF = '2026-09-20'
export const START = '2026-01-01'
export const number = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
})
export const compact = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
export const percent = (value: number) =>
  `${value > 0 ? '+' : ''}${number.format(value)}%`
export const date = (value: string) => value.split('-').reverse().join('/')

export function useMarket() {
  const stocks = useQuery({ queryKey: ['stocks'], queryFn: getStocks })
  const histories = useQueries({
    queries: (stocks.data ?? []).map((stock) => ({
      queryKey: ['prices', stock.symbol, START, CUTOFF],
      queryFn: () => getPriceSeries(stock.symbol, START, CUTOFF),
    })),
  })
  const rows = (stocks.data ?? []).map((stock, index) => {
    const prices = histories[index]?.data?.prices ?? []
    const latest = prices.at(-1)
    const previous = prices.at(-2)
    const change =
      latest && previous && previous.close > 0
        ? (latest.close / previous.close - 1) * 100
        : null
    return { ...stock, prices, latest, change }
  })
  return {
    rows,
    pending: stocks.isPending || histories.some((query) => query.isPending),
    failed: stocks.isError || histories.some((query) => query.isError),
    retry: () => {
      void stocks.refetch()
      histories.forEach((query) => {
        void query.refetch()
      })
    },
  }
}
