import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

const PORT = 4173;
/* En local, si un Chromium préinstallé existe, on l'utilise ; en CI, c'est celui de `npx playwright install`. */
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions = !process.env.CI && fs.existsSync(LOCAL_CHROMIUM)
  ? { executablePath: LOCAL_CHROMIUM }
  : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true, launchOptions } }],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory app`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    timeout: 30_000,
  },
});
