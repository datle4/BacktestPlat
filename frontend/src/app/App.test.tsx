import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import { AppShell } from '@/components/AppShell'
import { MarketHome } from '@/pages/MarketHome'
import { StocksPage } from '@/pages/StocksPage'
import { BacktestPage } from '@/pages/BacktestPage'

const stocks = [
  { id: 1, symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE' },
  { id: 2, symbol: 'VNM', name: 'Vinamilk', exchange: 'HOSE' },
]
const prices = [
  {
    date: '2026-09-17',
    open: 100000,
    high: 104000,
    low: 99000,
    close: 100000,
    volume: 1500000,
  },
  {
    date: '2026-09-18',
    open: 103000,
    high: 106000,
    low: 102000,
    close: 105000,
    volume: 1800000,
  },
]
function setup(path = '/') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<MarketHome />} />
            <Route path="stocks" element={<StocksPage />} />
            <Route path="backtest" element={<BacktestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Market workspace', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn()
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              input === '/api/stocks'
                ? stocks
                : { prices: input.includes('VNM') ? [prices[0]] : prices },
            ),
          ),
        ),
      ),
    )
  })

  it('aggregates only stocks with the same latest session and explains coverage', async () => {
    setup()
    await screen.findByRole('img', { name: /giá đóng cửa FPT/i })
    expect(screen.getByText('Không phải số liệu toàn sàn')).toBeInTheDocument()
    const stats = screen.getByText('Mã có dữ liệu cùng phiên').parentElement!
    expect(stats).toHaveTextContent('1 / 2 mã')
    expect(
      screen.getByText('Khối lượng giao dịch').parentElement,
    ).toHaveTextContent('1,8 Tr CP')
    expect(screen.getByRole('list')).toHaveTextContent('FPT')
    expect(screen.getByRole('list')).not.toHaveTextContent('VNM')
  })

  it('searches and sorts stocks, opens detail and applies a date range', async () => {
    const user = userEvent.setup()
    setup('/stocks')
    const table = await screen.findByRole('table')
    await user.selectOptions(screen.getByLabelText('Sắp xếp'), 'volume')
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('FPT')
    await user.type(screen.getByLabelText('Tìm cổ phiếu'), 'Vinamilk')
    expect(within(table).queryByText('FPT')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Xem VNM' }))
    await screen.findByRole('heading', { name: 'Lịch sử giá VNM' })
    await user.clear(screen.getByLabelText('Từ ngày'))
    await user.type(screen.getByLabelText('Từ ngày'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Xem dữ liệu' }))
    expect(fetch).toHaveBeenCalledWith(
      '/api/stocks/VNM/prices?from=2026-09-01&to=2026-09-20',
      expect.anything(),
    )
  })

  it('navigates between the three pages and saves a backtest draft without running it', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByRole('img', { name: /giá đóng cửa FPT/i })
    await user.click(screen.getByRole('link', { name: 'Backtest' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Phòng thử chiến lược',
    )
    await user.selectOptions(screen.getByLabelText('Cổ phiếu'), 'VNM')
    await user.click(screen.getByRole('button', { name: 'Lưu cấu hình nháp' }))
    expect(
      JSON.parse(localStorage.getItem('backtestplat-draft') ?? '{}'),
    ).toMatchObject({ symbol: 'VNM', capital: '100000000' })
    expect(screen.getByRole('status')).toHaveTextContent('Đã lưu')
    expect(screen.getByText('Chưa chạy')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Cổ phiếu' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Danh sách cổ phiếu',
    )
  })

  it('rejects reversed draft dates and restores a saved draft', async () => {
    localStorage.setItem(
      'backtestplat-draft',
      JSON.stringify({
        symbol: 'VNM',
        from: '2026-09-18',
        to: '2026-09-01',
        capital: '25000000',
        fee: '0.1',
      }),
    )
    setup('/backtest')
    expect(
      await screen.findByRole('option', { name: 'VNM — Vinamilk' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Cổ phiếu')).toHaveValue('VNM')
    expect(screen.getByRole('alert')).toHaveTextContent('Ngày kết thúc')
    expect(
      screen.getByRole('button', { name: 'Lưu cấu hình nháp' }),
    ).toBeDisabled()
  })

  it('handles loading and an empty dataset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('[]'))),
    )
    setup()
    expect(screen.getByText('Đang tải dữ liệu…')).toBeInTheDocument()
    expect(
      await screen.findByText('Chưa có dữ liệu trong bộ theo dõi'),
    ).toBeInTheDocument()
  })

  it('has no detectable accessibility violations with data loaded', async () => {
    const { container } = setup()
    await screen.findByRole('img', { name: /giá đóng cửa FPT/i })
    expect(await axe(container)).toHaveNoViolations()
  })
})
