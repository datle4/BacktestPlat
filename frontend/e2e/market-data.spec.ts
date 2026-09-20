import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const symbols = [
  'ACB',
  'BID',
  'CTG',
  'FPT',
  'GAS',
  'HPG',
  'MBB',
  'MSN',
  'MWG',
  'PLX',
  'SSI',
  'TCB',
  'VCB',
  'VIC',
  'VNM',
]
const stocks = symbols.map((symbol, index) => ({
  id: index + 1,
  symbol,
  name: symbol === 'FPT' ? 'FPT Corporation' : `${symbol} Company`,
  exchange: 'HOSE',
}))
const prices = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-08-${String(i + 1).padStart(2, '0')}`,
  open: 100000,
  high: 106000,
  low: 94000,
  close: 100000 + Math.sin(i) * 3500 + i * 50,
  volume: 1500000 + i * 25000,
}))

test.beforeEach(async ({ page }) => {
  await page.route('**/api/stocks', (route) => route.fulfill({ json: stocks }))
  await page.route('**/api/stocks/*/prices?*', (route) =>
    route.fulfill({ json: { prices } }),
  )
})

test('three pages are responsive, accessible in both themes, and retain drafts', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(
    page.getByRole('img', { name: /giá đóng cửa ACB/i }),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: /bỏ qua tới nội dung chính/i }),
  ).toBeFocused()

  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Giao diện').selectOption(theme)
    for (const route of ['/', '/stocks', '/backtest']) {
      await page.goto(route)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      if (route === '/')
        await expect(
          page.getByRole('img', { name: /giá đóng cửa ACB/i }),
        ).toBeVisible()
      if (route === '/stocks')
        await expect(
          page.getByRole('button', { name: 'Xem VNM' }),
        ).toBeAttached()
      if (route === '/backtest')
        await expect(
          page.getByRole('button', { name: 'Lưu cấu hình nháp' }),
        ).toBeEnabled()
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false)
      expect(
        (await new AxeBuilder({ page }).withTags(wcagTags).analyze())
          .violations,
      ).toEqual([])
      await page.screenshot({
        path: testInfo.outputPath(
          `${theme}-${route === '/' ? 'home' : route.slice(1)}.png`,
        ),
        fullPage: true,
      })
    }
  }

  await page
    .getByRole('combobox', { name: 'Cổ phiếu', exact: true })
    .selectOption('FPT')
  await page.getByRole('button', { name: 'Lưu cấu hình nháp' }).click()
  await expect(page.getByRole('status')).toContainText('Đã lưu')
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Cổ phiếu', exact: true }),
  ).toHaveValue('FPT')
  await page.getByRole('link', { name: 'Khám phá dữ liệu' }).click()
  await expect(page).toHaveURL(/stocks\?symbol=FPT/)
  await expect(
    page.getByRole('heading', { name: 'Lịch sử giá FPT' }),
  ).toBeVisible()
  await page.getByLabel('Tìm cổ phiếu').fill('nonexistent')
  await expect(page.getByRole('status')).toContainText('Không tìm thấy')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Phòng thử chiến lược',
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(
    await page
      .getByRole('button', { name: 'Lưu cấu hình nháp' })
      .evaluate((element) =>
        Math.max(
          ...getComputedStyle(element)
            .transitionDuration.split(',')
            .map((value) => Number.parseFloat(value) * 1000),
        ),
      ),
  ).toBeLessThanOrEqual(1)
})

test('data errors can be retried and empty price ranges are explained', async ({
  page,
}) => {
  let failed = true
  await page.route('**/api/stocks', (route) =>
    route.fulfill(
      failed
        ? { status: 503, json: { detail: 'Unavailable' } }
        : { json: stocks },
    ),
  )
  await page.goto('/')
  await expect(page.getByText('Chưa kết nối được dữ liệu')).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Thử tải lại' }).click()
  await expect(
    page.getByRole('img', { name: /giá đóng cửa ACB/i }),
  ).toBeVisible()
  await page.route('**/api/stocks/FPT/prices?*', (route) =>
    route.fulfill({ json: { prices: [] } }),
  )
  await page.goto('/stocks?symbol=FPT')
  await expect(
    page.getByText('Không có phiên trong khoảng đã chọn'),
  ).toBeVisible()
})
