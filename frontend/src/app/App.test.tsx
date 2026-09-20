import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '@/app/App'

const stocks = [
  { id: 1, symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE' },
  { id: 2, symbol: 'VNM', name: 'Vinamilk', exchange: 'HOSE' },
]

const series = {
  symbol: 'FPT',
  from: '2026-01-01',
  to: '2026-09-20',
  dataCutoff: '2026-09-20',
  count: 3,
  prices: [
    { date: '2026-09-16', open: 98_000, high: 101_000, low: 97_000, close: 100_000, volume: 1_200_000 },
    { date: '2026-09-17', open: 100_000, high: 104_000, low: 99_000, close: 103_000, volume: 1_500_000 },
    { date: '2026-09-18', open: 103_000, high: 106_000, low: 102_000, close: 105_000, volume: 1_800_000 },
  ],
}

function jsonResponse(body: unknown) {
  return { ok: true, json: () => Promise.resolve(body) } as Response
}

describe('Market data overview', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      return Promise.resolve(jsonResponse(url === '/api/stocks' ? stocks : series))
    }))
  })

  it('loads stocks and renders the historical price overview', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /dữ liệu thị trường/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'FPT' })).toBeInTheDocument()
    expect(screen.getByText('FPT Corporation · HOSE')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /giá đóng cửa fpt/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /khối lượng/i })).toBeInTheDocument()
    expect(screen.getAllByText('105.000')).not.toHaveLength(0)
  })

  it('applies a new date range and keeps the selected theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { level: 2, name: 'FPT' })
    await user.clear(screen.getByLabelText(/từ ngày/i))
    await user.type(screen.getByLabelText(/từ ngày/i), '2026-09-01')
    await user.click(screen.getByRole('button', { name: /xem dữ liệu/i }))
    await user.selectOptions(screen.getByLabelText(/giao diện/i), 'dark')

    expect(fetch).toHaveBeenCalledWith(
      '/api/stocks/FPT/prices?from=2026-09-01&to=2026-09-20',
      expect.anything(),
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem('backtestplat-preferences')).toContain('dark')
  })

  it('has no detectable accessibility violations with market data loaded', async () => {
    const { container } = render(<App />)
    await screen.findByRole('heading', { level: 2, name: 'FPT' })

    expect(await axe(container)).toHaveNoViolations()
  })
})
