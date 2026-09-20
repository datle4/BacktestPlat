export interface BacktestRequest {
  symbol: string
  from: string
  to: string
  capital: number
  feePercent: number
}
export interface EquityPoint {
  date: string
  cash: number
  quantity: number
  marketValue: number
  equity: number
  drawdownPercent: number
}
export type OrderStatus =
  | 'FILLED'
  | 'ALREADY_HOLDING'
  | 'NO_POSITION'
  | 'INSUFFICIENT_CASH'
  | 'ZERO_VOLUME'
  | 'NO_NEXT_SESSION'
export interface OrderEvent {
  signalDate: string
  executionDate: string | null
  action: 'BUY' | 'SELL'
  status: OrderStatus
  quantity: number
  price: number | null
  fee: number
  cashAfter: number
  realizedPnl: number | null
}
export interface BacktestRun {
  schemaVersion: number
  id: string
  createdAt: string
  dataCutoff: string
  request: BacktestRequest
  simulation: {
    provider: string
    firstSession: string
    lastSession: string
    sessionCount: number
    metrics: {
      finalEquity: number
      netProfit: number
      totalReturnPercent: number
      maxDrawdownPercent: number
      totalFees: number
      completedTrades: number
      winRatePercent: number | null
      realizedPnl: number
      unrealizedPnl: number
      cash: number
      openQuantity: number
      marketValue: number
    }
    equity: EquityPoint[]
    orders: OrderEvent[]
  }
}
async function request(
  url: string,
  body?: BacktestRequest,
): Promise<BacktestRun> {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      detail?: string
    }
    throw new Error(
      problem.detail ?? 'Không thể xử lý backtest. Vui lòng thử lại.',
    )
  }
  return response.json() as Promise<BacktestRun>
}
export const createBacktest = (body: BacktestRequest) =>
  request('/api/backtests', body)
export const getBacktest = (id: string) =>
  request(`/api/backtests/${encodeURIComponent(id)}`)
