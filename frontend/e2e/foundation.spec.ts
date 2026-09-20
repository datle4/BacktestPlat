import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('Foundation shell is responsive and has no automated A/AA violations', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /nền tảng backtest cổ phiếu/i,
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /bỏ qua tới nội dung chính/i })).toHaveAttribute(
    'href',
    '#main-content',
  )

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
  const longestTransitionMs = await page.getByLabel(/giao diện/i).evaluate((element) =>
    Math.max(
      ...getComputedStyle(element)
        .transitionDuration.split(',')
        .map((duration) =>
          duration.trim().endsWith('ms')
            ? Number.parseFloat(duration)
            : Number.parseFloat(duration) * 1_000,
        ),
    ),
  )
  expect(longestTransitionMs).toBeLessThanOrEqual(1)
})
