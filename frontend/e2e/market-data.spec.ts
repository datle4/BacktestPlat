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
    await page.getByRole('button', { name: /^Giao diện:/ }).click()
    await page
      .getByRole('menuitemradio', {
        name: theme === 'light' ? 'Sáng' : 'Tối',
        exact: true,
      })
      .click()
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

test('compact theme dropdown opens below its button and supports keyboard and saved preferences', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await expect(
    page.getByRole('img', { name: /giá đóng cửa ACB/i }),
  ).toBeVisible()
  for (const label of ['Sáng', 'Tối']) {
    const trigger = page.getByRole('button', { name: /^Giao diện:/ })
    await trigger.click()
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => undefined)),
      )
    })
    await trigger.click()
    const menu = page.getByRole('menu', { name: 'Giao diện' })
    const buttonBox = await trigger.boundingBox()
    const menuBox = await menu.boundingBox()
    expect(menuBox!.y).toBeGreaterThanOrEqual(
      buttonBox!.y + buttonBox!.height + 7,
    )
    expect(menuBox!.x).toBeGreaterThanOrEqual(0)
    expect(buttonBox!.width).toBeLessThan(105)
    await expect(menu.getByRole('menuitemradio')).toHaveCount(2)
    expect(
      (await new AxeBuilder({ page }).withTags(wcagTags).analyze()).violations,
    ).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`theme-${label}.png`) })
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  }
  const trigger = page.getByRole('button', { name: /^Giao diện:/ })
  await trigger.press('ArrowDown')
  await page.keyboard.press('Home')
  await expect(
    page.getByRole('menuitemradio', { name: 'Sáng', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('End')
  await expect(
    page.getByRole('menuitemradio', { name: 'Tối', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(trigger).toHaveAccessibleName('Giao diện: Tối')
  await trigger.click()
  await page.getByRole('heading', { level: 1 }).click()
  await expect(page.getByRole('menu')).toBeHidden()
  expect(
    await page
      .locator('.workspace-body')
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--grid-line').trim(),
      ),
  ).toBe('transparent')
})

test('legacy system preference becomes light', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'backtestplat-preferences',
      JSON.stringify({ state: { theme: 'system' }, version: 0 }),
    ),
  )
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Giao diện: Sáng', exact: true }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('exchange-style candles support timeframes, pan, zoom and accessible OHLC', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const history = Array.from({ length: 86 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 5, index + 1)).toISOString().slice(0, 10),
    open: 100000 + index * 100,
    high: 106000 + index * 100,
    low: 94000 + index * 100,
    close: 100000 + Math.sin(index) * 3500 + index * 100,
    volume: 1500000 + index * 25000,
  }))
  await page.route('**/api/stocks/FPT/prices?*', (route) =>
    route.fulfill({ json: { prices: history } }),
  )
  await page.goto('/stocks?symbol=FPT')
  const chart = page.locator('.candlestick-chart')
  await expect(
    chart.getByRole('img', { name: 'Biểu đồ nến FPT 1D', exact: true }),
  ).toBeVisible()
  await expect(chart.locator('canvas').first()).toBeVisible()
  const count = chart.locator('.candle-footer > span')
  await expect(count).toContainText('86 nến')
  const original = await count.textContent()
  await chart
    .getByRole('button', { name: 'Phóng to biểu đồ', exact: true })
    .click()
  await expect(count).not.toHaveText(original!)
  await chart.getByRole('button', { name: 'Đặt lại biểu đồ' }).click()
  await expect(count).toHaveText(original!)
  await chart.getByRole('button', { name: 'Xem lịch sử cũ hơn' }).click()
  await expect(
    chart.getByRole('button', { name: 'Xem lịch sử mới hơn' }),
  ).toBeEnabled()
  await chart.getByRole('button', { name: 'Đặt lại biểu đồ' }).click()
  await chart.getByText('Xem dữ liệu từng nến', { exact: true }).click()
  const slider = chart.getByRole('slider', { name: 'Chọn nến' })
  await slider.focus()
  await slider.press('Home')
  await expect(
    chart.getByRole('group', { name: 'Thông tin nến' }),
  ).toContainText('01/06/2026')
  await slider.press('End')
  await expect(
    chart.getByRole('group', { name: 'Thông tin nến' }),
  ).toContainText('25/08/2026')
  const canvas = chart.locator('canvas').first()
  const box = await canvas.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  const beforeWheel = await count.textContent()
  await page.mouse.wheel(0, -180)
  await expect(count).not.toHaveText(beforeWheel!)
  await page.mouse.down()
  await page.mouse.move(
    box!.x + box!.width / 2 + 90,
    box!.y + box!.height / 2,
    { steps: 8 },
  )
  await page.mouse.up()
  await expect(
    chart.getByRole('button', { name: 'Xem lịch sử mới hơn' }),
  ).toBeEnabled()
  await chart.getByRole('button', { name: 'Đặt lại biểu đồ' }).click()
  await expect(
    chart.getByRole('button', { name: 'Xem lịch sử mới hơn' }),
  ).toBeDisabled()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  for (const label of ['Sáng', 'Tối']) {
    const beforeTheme = await count.textContent()
    await page.getByRole('button', { name: /^Giao diện:/ }).click()
    await page.getByRole('menuitemradio', { name: label, exact: true }).click()
    await expect(count).toHaveText(beforeTheme!)
    for (const frame of ['1D', '1W', '1M', '1Y']) {
      await chart.getByRole('button', { name: frame, exact: true }).click()
      await expect(
        chart.getByRole('img', {
          name: `Biểu đồ nến FPT ${frame}`,
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        chart.getByRole('button', { name: frame, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true')
      if (frame === '1M') await expect(count).toContainText('3 nến')
      if (frame === '1Y') {
        await expect(count).toContainText('1 nến')
        await chart.getByText('Xem dữ liệu từng nến', { exact: true }).click()
        await expect(slider).toBeDisabled()
        await expect(chart).toContainText('Mở rộng “Từ ngày”')
      }
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false)
      await chart.screenshot({
        path: testInfo.outputPath(`candles-${label}-${frame}.png`),
      })
    }
    expect(
      (await new AxeBuilder({ page }).withTags(wcagTags).analyze()).violations,
    ).toEqual([])
  }
  expect(errors).toEqual([])
})
