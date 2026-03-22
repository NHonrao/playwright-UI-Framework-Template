import { test, expect } from '../../fixtures/customFixtures';
import { allure } from 'allure-playwright';
import { applyCommonHooks } from '../../fixtures/hooks';

// suppress unused-import warning — expect is re-exported for convenience
void expect;

/**
 * ═══════════════════════════════════════════════════════════════
 * Example Authentication Test Suite
 * ═══════════════════════════════════════════════════════════════
 * Replace the suite name, Allure labels, page objects and selectors
 * with values specific to your project.
 * Tests follow Arrange → Act → Assert (AAA).
 * All hook logic lives in src/fixtures/hooks.ts — one call per suite.
 * ═══════════════════════════════════════════════════════════════
 */
test.describe('Authentication Tests', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  applyCommonHooks(test, {
    suiteName : 'Authentication Tests',
    parentSuite: 'Automation Suite',
    suite      : 'Authentication',
    subSuite   : 'Login',
  });

  // ════════════════════════════════════════════════════════════════════════
  // TEST CASES
  // ════════════════════════════════════════════════════════════════════════

  /**
   * TC001 — Successful login
   * Category : Smoke | Regression | Critical
   */
  test('TC001 - Successful login should display Home page', async ({
    loginPage,
    homePage,
    testDataManager,
  }) => {
    allure.epic('My Application');       // ← replace with your product name
    allure.feature('Authentication');
    allure.story('Successful Login');
    allure.severity('critical');
    allure.tag('smoke');
    allure.tag('regression');
    allure.tag('happy-path');
    allure.owner('YourName');             // ← replace with your name
    allure.description('Verify a valid user can authenticate and the Home page is displayed after login.');
    allure.tms('TC001', 'https://testmanager.example.com/TC001'); // ← replace with your TMS link

    // ── Arrange ────────────────────────────────────────────────────────────
    const credentials = testDataManager.getUserData('admin');

    // ── Act ────────────────────────────────────────────────────────────────
    await test.step('Navigate to Login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Login with valid credentials', async () => {
      await loginPage.login(credentials.username, credentials.password);
    });

    // ── Assert ─────────────────────────────────────────────────────────────
    await test.step('Verify Home page is displayed', async () => {
      await homePage.verifyHomeIsVisible();
    });

    await test.step('Verify user is logged in', async () => {
      await homePage.verifyUserIsLoggedIn();
    });
  });

  /**
   * TC002 — Invalid credentials are rejected
   * Category : Regression | Negative | Security
   */
  test('TC002 - Invalid credentials should not allow login', async ({
    loginPage,
    testDataManager,
  }) => {
    allure.epic('My Application');
    allure.feature('Authentication');
    allure.story('Failed Login — Invalid Credentials');
    allure.severity('normal');
    allure.tag('negative');
    allure.tag('regression');
    allure.tag('security');
    allure.owner('YourName');
    allure.description(
      'Verify that invalid credentials are rejected — application shows an error or keeps the user on the login page.'
    );
    allure.tms('TC002', 'https://testmanager.example.com/TC002');

    // ── Arrange ────────────────────────────────────────────────────────────
    const { invalidCredentials } = testDataManager.getTestData<{
      validCredentials: { username: string; password: string };
      invalidCredentials: { username: string; password: string };
    }>('login');

    // ── Act ────────────────────────────────────────────────────────────────
    await test.step('Navigate to Login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Attempt login with invalid credentials', async () => {
      await loginPage.login(invalidCredentials.username, invalidCredentials.password);
    });

    // ── Assert ─────────────────────────────────────────────────────────────
    await test.step('Verify login was rejected', async () => {
      await loginPage.verifyLoginFailed();
    });
  });

  /**
   * TC003 — Login page UI validation
   * Category : Smoke | UI
   */
  test('TC003 - Login page should have required elements', async ({ loginPage }) => {
    allure.epic('My Application');
    allure.feature('Authentication');
    allure.story('Login Page UI Validation');
    allure.severity('minor');
    allure.tag('ui');
    allure.tag('smoke');
    allure.owner('YourName');
    allure.description('Verify the login page loads with a visible form, non-empty title and correct URL.');
    allure.tms('TC003', 'https://testmanager.example.com/TC003');

    // ── Act ────────────────────────────────────────────────────────────────
    await test.step('Navigate to Login page', async () => {
      await loginPage.navigate();
    });

    // ── Assert ─────────────────────────────────────────────────────────────
    await test.step('Verify login form is displayed', async () => {
      await loginPage.verifyLoginPageIsDisplayed();
    });

    await test.step('Verify page title is present', async () => {
      await loginPage.verifyPageTitleIsPresent();
    });

    await test.step('Verify URL references the login page', async () => {
      await loginPage.verifyLoginUrlIsCorrect();
    });
  });
});
