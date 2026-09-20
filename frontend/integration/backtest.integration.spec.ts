import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { BacktestRun } from '../src/api/backtests'
import type { PriceSeries } from '../src/api/marketData'

test('historical data to persisted backtest through the real Docker stack', async ({
  page,
  request,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/stocks?symbol=FPT')
  await expect(
    page.getByRole('img', { name: 'Biểu đồ nến FPT 1D', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Backtest', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Cổ phiếu', exact: true })
    .selectOption('FPT')
  await page.getByLabel('Từ ngày').fill('2026-01-01')
  await page.getByLabel('Đến ngày').fill('2026-09-20')
  await page.getByLabel('Vốn ban đầu (VND)').fill('100000000')
  await page.getByLabel('Phí giao dịch (% mỗi chiều)').fill('0.15')
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/backtests') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Chạy backtest', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(201)
  const run = (await response.json()) as BacktestRun
  await expect(page).toHaveURL(new RegExp(`run=${run.id}`))
  await expect(
    page.getByRole('heading', { name: 'FPT · Báo cáo thử nghiệm' }),
  ).toBeVisible()
  expect(run.simulation.provider).toBe('mock-cycle-v1')
  expect(run.simulation.sessionCount).toBeGreaterThanOrEqual(7)
  const pricesResponse = await request.get(
    '/api/stocks/FPT/prices?from=2026-01-01&to=2026-09-20',
  )
  expect(pricesResponse.ok()).toBeTruthy()
  const history = (await pricesResponse.json()) as PriceSeries
  expect(run.simulation.sessionCount).toBe(history.prices.length)
  for (const order of run.simulation.orders.filter(
    (order) => order.status === 'FILLED',
  )) {
    const signalIndex = history.prices.findIndex(
      (bar) => bar.date === order.signalDate,
    )
    expect(order.executionDate).toBe(history.prices[signalIndex + 1].date)
    expect(order.price).toBe(history.prices[signalIndex + 1].open)
    expect(order.cashAfter).toBeGreaterThanOrEqual(0)
  }
  const m = run.simulation.metrics
  expect(m.finalEquity).toBeCloseTo(m.cash + m.marketValue, 2)
  expect(m.netProfit).toBeCloseTo(m.finalEquity - run.request.capital, 2)
  expect(m.netProfit).toBeCloseTo(m.realizedPnl + m.unrealizedPnl, 2)
  expect(m.totalFees).toBeCloseTo(
    run.simulation.orders.reduce((sum, order) => sum + order.fee, 0),
    2,
  )
  expect(m.completedTrades).toBeGreaterThan(0)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'FPT · Báo cáo thử nghiệm' }),
  ).toBeVisible()
  const stored = await request.get(`/api/backtests/${run.id}`)
  expect(await stored.json()).toEqual(run)
  for (const theme of ['Sáng', 'Tối']) {
    await page.getByRole('button', { name: /^Giao diện:/ }).click()
    await page.getByRole('menuitemradio', { name: theme, exact: true }).click()
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      )
    })
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([])
    await page
      .locator('.backtest-results')
      .screenshot({ path: info.outputPath(`real-result-${theme}.png`) })
  }
  expect(errors).toEqual([])
  await info.attach('saved-backtest', {
    body: JSON.stringify(run, null, 2),
    contentType: 'application/json',
  })
})
