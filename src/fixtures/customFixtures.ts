import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ScreenshotHelper } from '../utils/ScreenshotHelper';
import { DatabaseHelper } from '../utils/DatabaseHelper';
import { TestDataManager } from '../utils/TestDataManager';
import { WaitHelper } from '../utils/WaitHelper';
import { Logger } from '../utils/Logger';
import { config } from '../config/config';

type CustomFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  screenshotHelper: ScreenshotHelper;
  waitHelper: WaitHelper;
  dbHelper: DatabaseHelper;
  testDataManager: TestDataManager;
  /**
   * Fixture: authenticatedPage
   * Setup   : Navigates to login URL and completes the login flow.
   * Teardown: Attempts logout, then takes a failure screenshot if the test failed.
   */
  authenticatedPage: Page;
  /**
   * Fixture: loggedInPage
   * Alias for authenticatedPage — provided for semantic clarity in test steps.
   */
  loggedInPage: Page;
};

export const test = base.extend<CustomFixtures>({
  // ── Page Object fixtures ────────────────────────────────────────────────────

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  screenshotHelper: async ({ page }, use) => {
    await use(new ScreenshotHelper(page, config.screenshotDir));
  },

  waitHelper: async ({ page }, use) => {
    await use(new WaitHelper(page));
  },

  // ── Helper / data fixtures ──────────────────────────────────────────────────

  dbHelper: async ({}, use) => {
    const db = new DatabaseHelper();
    await use(db);
    // Teardown: always close the DB connection after the test
    await db.disconnect();
  },

  testDataManager: async ({}, use) => {
    const tdm = new TestDataManager();
    await use(tdm);
    // Teardown: clear in-memory cache to avoid cross-test pollution
    tdm.clearCache();
  },

  // ── Authenticated session fixtures ──────────────────────────────────────────

  /**
   * authenticatedPage
   *
   * Before (Setup):
   *   1. Navigate to the configured login URL.
   *   2. Perform login with admin credentials from environment config.
   *   3. Wait for the Home page to confirm a successful session.
   *
   * After (Teardown):
   *   1. Attempt graceful logout so the browser session is clean for the next test.
   *   2. Failure screenshot is captured centrally by applyCommonHooks afterEach in hooks.ts.
   */
  authenticatedPage: async ({ page }, use, testInfo) => {
    const logger = new Logger('AuthFixture');
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    // ── SETUP ──
    logger.info('[BeforeTest] Setting up authenticated session for: "' + testInfo.title + '"');
    await loginPage.navigate();
    await loginPage.login(config.adminUsername, config.adminPassword);
    await homePage.verifyHomeIsVisible();
    logger.info('[BeforeTest] Authentication complete — handing page to test');

    await use(page);

    // ── TEARDOWN ──
    logger.info(`[AfterTest] Tearing down session for: "${testInfo.title}"`);

    // Logout — keeps browser state clean between tests
    await homePage.logout();
    logger.info('[AfterTest] Logout performed');

    // Note: failure screenshot + Allure attachment is handled centrally by
    // applyCommonHooks afterEach in hooks.ts — do not duplicate it here.

    logger.info(`[AfterTest] Teardown complete — status: ${testInfo.status?.toUpperCase()}`);
  },

  /**
   * loggedInPage — semantic alias for authenticatedPage.
   * Use this in tests that explicitly describe a "logged-in user" scenario.
   */
  loggedInPage: async ({ authenticatedPage }, use) => {
    await use(authenticatedPage);
  },
});

export { expect } from '@playwright/test';

