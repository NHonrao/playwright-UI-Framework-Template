import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file first, then fall back to defaults
const env = process.env.TEST_ENV || 'tst';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Headless mode:
//   - CI always runs headless (process.env.CI is set by the pipeline).
//   - Locally runs headed by default so you can see the browser.
//   - Set HEADLESS=true locally to force headless: $env:HEADLESS='true'; npx playwright test
const headless = !!process.env.CI || process.env.HEADLESS === 'true';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,
  timeout: 60000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: false,
        categories: [
          {
            name: 'Ignored tests',
            matchedStatuses: ['skipped'],
          },
          {
            name: 'Product defects',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Test defects',
            matchedStatuses: ['broken'],
          },
        ],
      },
    ],
  ],

  use: {
    headless: headless,
    baseURL: process.env.BASE_URL || 'https://tst-gb.harlands-ddms.co.uk',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  outputDir: 'reports/test-results',
});
