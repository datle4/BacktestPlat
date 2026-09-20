import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

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

test.beforeEach(async ({ page }) => {
  await page.route('**/api/stocks', (route) => route.fulfill({ json: stocks }))
  await page.route('**/api/stocks/*/prices?*', (route) => route.fulfill({ json: series }))
})

test('Market data screen is responsive and accessible in both themes', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: /dữ liệu thị trường/i })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'FPT' })).toBeVisible()
  await expect(page.getByRole('img', { name: /giá đóng cửa fpt/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /bỏ qua tới nội dung chính/i })).toHaveAttribute('href', '#main-content')

  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasPageOverflow).toBe(false)

  const lightAccessibility = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  expect(lightAccessibility.violations).toEqual([])

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /bỏ qua tới nội dung chính/i })).toBeFocused()

  await page.getByLabel(/giao diện/i).selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const darkAccessibility = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  expect(darkAccessibility.violations).toEqual([])

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const longestTransitionMs = await page.getByRole('button', { name: /xem dữ liệu/i }).evaluate((element) =>
    Math.max(
      ...getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) => duration.trim().endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1_000),
    ),
  )
  expect(longestTransitionMs).toBeLessThanOrEqual(1)
})
