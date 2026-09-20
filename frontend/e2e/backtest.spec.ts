import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const id = '12345678-1234-4234-9234-123456789abc'
const request = {
  symbol: 'FPT',
  from: '2026-01-01',
  to: '2026-09-20',
  capital: 100000000,
  feePercent: 0.15,
}
// Transport fixture: engine arithmetic is tested independently in Java.
const run = {
  schemaVersion: 1,
  id,
  createdAt: '2026-09-20T10:00:00Z',
  dataCutoff: '2026-09-20',
  request,
  simulation: {
    provider: 'mock-cycle-v1',
    firstSession: '2026-01-02',
    lastSession: '2026-01-08',
    sessionCount: 7,
    metrics: {
      finalEquity: 105000000,
      netProfit: 5000000,
      totalReturnPercent: 5,
      maxDrawdownPercent: 2,
      totalFees: 300000,
      completedTrades: 1,
      winRatePercent: 100,
      realizedPnl: 5000000,
      unrealizedPnl: 0,
      cash: 105000000,
      openQuantity: 0,
      marketValue: 0,
    },
    equity: Array.from({ length: 7 }, (_, i) => ({
      date: `2026-01-0${i + 2}`,
      cash: 100000000 + (i * 5000000) / 6,
      quantity: 0,
      marketValue: 0,
      equity: 100000000 + (i * 5000000) / 6,
      drawdownPercent: 0,
    })),
    orders: [
      {
        signalDate: '2026-01-02',
        executionDate: '2026-01-03',
        action: 'BUY',
        status: 'FILLED',
        quantity: 998,
        price: 100000,
        fee: 149700,
        cashAfter: 50300,
        realizedPnl: null,
      },
      {
        signalDate: '2026-01-07',
        executionDate: '2026-01-08',
        action: 'SELL',
        status: 'FILLED',
        quantity: 998,
        price: 105000,
        fee: 157185,
        cashAfter: 104683115,
        realizedPnl: 4683115,
      },
    ],
  },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/stocks', (route) =>
    route.fulfill({
      json: [
        { id: 1, symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE' },
      ],
    }),
  )
  await page.route(`**/api/backtests/${id}`, (route) =>
    route.fulfill({ json: run }),
  )
})

test('runs once, reloads the saved result and reads the curve in both themes', async ({
  page,
}, info) => {
  let posts = 0
  await page.route('**/api/backtests', async (route) => {
    posts++
    expect(route.request().postDataJSON()).toEqual(request)
    await route.fulfill({ status: 201, json: run })
  })
  await page.goto('/backtest')
  await expect(
    page.getByRole('button', { name: 'Chạy backtest', exact: true }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Chạy backtest', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`run=${id}`))
  await expect(
    page.getByRole('heading', { name: 'FPT · Báo cáo thử nghiệm' }),
  ).toBeVisible()
  await expect(page.getByText('+5%', { exact: true })).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'FPT · Báo cáo thử nghiệm' }),
  ).toBeVisible()
  expect(posts).toBe(1)
  const slider = page.getByRole('slider', {
    name: 'Chọn phiên để xem chi tiết',
  })
  await slider.focus()
  await slider.press('Home')
  await expect(
    page.getByRole('group', { name: 'Giá trị tài khoản theo phiên' }),
  ).toContainText('02/01/2026')
  await slider.press('End')
  await expect(
    page.getByRole('group', { name: 'Giá trị tài khoản theo phiên' }),
  ).toContainText('08/01/2026')
  for (const theme of ['Sáng', 'Tối']) {
    await page.getByRole('button', { name: /^Giao diện:/ }).click()
    await page.getByRole('menuitemradio', { name: theme, exact: true }).click()
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => undefined)))
    })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false)
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([])
    await page
      .locator('.backtest-results')
      .screenshot({ path: info.outputPath(`results-${theme}.png`) })
  }
  await page.getByLabel('Vốn ban đầu (VND)').fill('50000000')
  await expect(page.locator('.result-inputs')).toContainText('100.000.000')
})

test('shows progress and server errors, permits retry and explains missing saved runs', async ({
  page,
}) => {
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/backtests', async (route) => {
    await pending
    await route.fulfill({
      status: 422,
      json: { detail: 'Cần ít nhất 2 phiên có dữ liệu.' },
    })
  })
  await page.goto('/backtest')
  await page.getByRole('button', { name: 'Chạy backtest', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang chạy…' })).toBeDisabled()
  release!()
  await expect(page.getByRole('alert')).toContainText('Cần ít nhất 2 phiên')
  await expect(
    page.getByRole('button', { name: 'Chạy backtest', exact: true }),
  ).toBeEnabled()
  await page.route('**/api/backtests/missing', (route) =>
    route.fulfill({
      status: 404,
      json: { detail: 'Không tìm thấy kết quả backtest' },
    }),
  )
  await page.goto('/backtest?run=missing')
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy kết quả')
  await expect(
    page.getByRole('button', { name: 'Tải lại kết quả' }),
  ).toBeVisible()
})

test('handles open positions, null win rate and paginated skipped orders', async ({
  page,
}) => {
  await page.route(`**/api/backtests/${id}`, (route) =>
    route.fulfill({
      json: {
        ...run,
        simulation: {
          ...run.simulation,
          metrics: {
            ...run.simulation.metrics,
            completedTrades: 0,
            winRatePercent: null,
            openQuantity: 998,
            unrealizedPnl: 10000,
          },
          orders: Array.from({ length: 12 }, (_, i) => ({
            ...run.simulation.orders[0],
            signalDate: `2026-01-${String(i + 2).padStart(2, '0')}`,
            status: i === 11 ? 'NO_NEXT_SESSION' : 'INSUFFICIENT_CASH',
            quantity: 0,
            executionDate: null,
            price: null,
            fee: 0,
          })),
        },
      },
    }),
  )
  await page.goto(`/backtest?run=${id}`)
  await expect(page.getByText('Chưa có vòng mua–bán hoàn tất')).toBeVisible()
  await expect(page.getByText('Trang 1 / 2')).toBeVisible()
  await page.getByRole('button', { name: 'Sau', exact: true }).click()
  await expect(page.getByText('Trang 2 / 2')).toBeVisible()
  await expect(
    page.getByText('Hết phiên trong khoảng', { exact: true }),
  ).toBeVisible()
})
