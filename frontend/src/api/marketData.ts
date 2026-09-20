export interface Stock {
  id: number
  symbol: string
  name: string
  exchange: string
}

export interface PricePoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PriceSeries {
  symbol: string
  from: string
  to: string
  dataCutoff: string
  count: number
  prices: PricePoint[]
}

interface ApiProblem {
  detail?: string
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ApiProblem
    throw new Error(problem.detail ?? 'Không thể tải dữ liệu từ máy chủ')
  }
  return response.json() as Promise<T>
}

export function getStocks() {
  return requestJson<Stock[]>('/api/stocks')
}

export function getPriceSeries(symbol: string, from: string, to: string) {
  const params = new URLSearchParams({ from, to })
  return requestJson<PriceSeries>(`/api/stocks/${encodeURIComponent(symbol)}/prices?${params}`)
}
