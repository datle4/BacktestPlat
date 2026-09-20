import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './integration',
  fullyParallel: false,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.APP_BASE_URL ?? 'http://127.0.0.1:8088',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})
