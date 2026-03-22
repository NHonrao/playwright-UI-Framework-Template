import { allure } from 'allure-playwright';
import { Logger } from '../utils/Logger';
import { config } from '../config/config';
import { ScreenshotHelper } from '../utils/ScreenshotHelper';

/**
 * Options passed to applyCommonHooks() to customise the Allure hierarchy
 * and logging labels for a given test suite.
 */
export interface SuiteHookOptions {
  /** Human-readable suite name used in log output (e.g. "DDMS Authentication Tests"). */
  suiteName: string;
  /** Allure parentSuite label — top-level grouping (e.g. "DDMS Automation Suite"). */
  parentSuite: string;
  /** Allure suite label — mid-level grouping (e.g. "Authentication"). */
  suite: string;
  /** Allure subSuite label — lowest grouping (e.g. "Login"). */
  subSuite: string;
}

/**
 * Minimal structural type for the Playwright test API.
 * Allows hooks.ts to accept both the base test and any extended fixture test
 * without creating a circular dependency.
 */
interface HookableTest {
  beforeAll(fn: () => Promise<void> | void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeEach(fn: (fixtures: any, testInfo: any) => Promise<void> | void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  afterEach(fn: (fixtures: any, testInfo: any) => Promise<void> | void): void;
  afterAll(fn: () => Promise<void> | void): void;
}

/**
 * applyCommonHooks
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers beforeAll / beforeEach / afterEach / afterAll hooks onto the given
 * Playwright `test` object.
 *
 * Call this ONCE at the top of a describe block — it replaces all repeated hook
 * boilerplate across every test file:
 *
 * ```ts
 * test.describe('My Suite', () => {
 *   applyCommonHooks(test, {
 *     suiteName : 'My Suite',
 *     parentSuite: 'DDMS Automation Suite',
 *     suite      : 'My Feature',
 *     subSuite   : 'My Sub-feature',
 *   });
 *
 *   test('TC001 ...', async ({ ... }) => { ... });
 * });
 * ```
 *
 * What each hook does:
 *  beforeAll  — logs suite start with environment / URL info.
 *  beforeEach — logs test start; applies shared Allure suite hierarchy + params.
 *  afterEach  — logs result; on failure: saves screenshot to disk AND attaches
 *               it inline to the Allure report with the failure URL.
 *  afterAll   — logs suite end.
 */
export function applyCommonHooks(test: HookableTest, options: SuiteHookOptions): void {
  const logger = new Logger(options.suiteName);

  // ── BEFORE ALL ─────────────────────────────────────────────────────────────
  test.beforeAll(async () => {
    logger.info('═══════════════════════════════════════════════');
    logger.info(`  SUITE START: ${options.suiteName}`);
    logger.info(`  Environment : ${config.env}`);
    logger.info(`  Base URL    : ${config.baseUrl}`);
    logger.info('═══════════════════════════════════════════════');
  });

  // ── BEFORE EACH ────────────────────────────────────────────────────────────
  // Runs before every test in the describe block.
  // Applies shared Allure hierarchy labels + runtime parameters.
  // Test-specific annotations (epic, feature, story, severity, tags) remain
  // inside each individual test — they describe that test, not the suite.
  test.beforeEach(async ({}, testInfo) => {
    logger.info(`▶ [BeforeEach] "${testInfo.title}" | ${testInfo.project.name} | attempt ${testInfo.retry + 1}`);

    // Allure suite hierarchy (same for every test in this describe block)
    allure.label('parentSuite', options.parentSuite);
    allure.label('suite', options.suite);
    allure.label('subSuite', options.subSuite);
    allure.label('project', 'DDMS');

    // Runtime parameters visible in the Allure report
    allure.parameter('Environment', config.env);
    allure.parameter('Browser', testInfo.project.name);
    allure.parameter('Attempt', String(testInfo.retry + 1));
  });

  // ── AFTER EACH ─────────────────────────────────────────────────────────────
  // Runs after every test. On failure: saves a screenshot and attaches it to
  // the Allure report so it is visible without downloading artifacts.
  test.afterEach(async ({ page, screenshotHelper }, testInfo) => {
    const status = testInfo.status ?? 'unknown';
    const passed = status === testInfo.expectedStatus;

    if (!passed) {
      logger.error(`✖ [AfterEach] FAILED: "${testInfo.title}" (${testInfo.duration}ms)`);

      // Save screenshot to disk (reports/screenshots/)
      const helper: ScreenshotHelper = screenshotHelper ?? new ScreenshotHelper(page, config.screenshotDir);
      await helper.takeFailureScreenshot(testInfo.title);

      // Attach screenshot inline to Allure for immediate report visibility
      const screenshot = await page.screenshot({ fullPage: true });
      await allure.attachment('Failure Screenshot', screenshot, { contentType: 'image/png' });
      await allure.attachment('Failure URL', page.url(), { contentType: 'text/plain' });
    } else {
      logger.info(`✔ [AfterEach] PASSED: "${testInfo.title}" (${testInfo.duration}ms)`);
    }

    logger.info('─────────────────────────────────────────────────');
  });

  // ── AFTER ALL ──────────────────────────────────────────────────────────────
  test.afterAll(async () => {
    logger.info('═══════════════════════════════════════════════');
    logger.info(`  SUITE END: ${options.suiteName}`);
    logger.info('═══════════════════════════════════════════════');
  });
}
