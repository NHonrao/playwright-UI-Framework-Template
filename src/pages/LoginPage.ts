import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { config } from '../config/config';

/**
 * LoginPage — Page Object for the - Login screen.
 *
 * OOP Principles applied:
 *  - Encapsulation : All selectors are private. Tests interact only through
 *                    descriptive public methods — no selector leaks into tests.
 *  - Single Responsibility: This class owns everything about the login page
 *                    (navigation, form interaction, assertions).
 *  - Inheritance  : Inherits interaction & assertion helpers from BasePage so
 *                   no Playwright code is duplicated.
 *
 * Public API surface (what tests call):
 *   navigate()                   — go to the login URL
 *   login(username, password)    — fill form and submit in one call
 *   verifyLoginPageIsDisplayed() — asserts the login form is visible
 *   verifyLoginFailed()          — asserts an error or that user stayed on page
 *   verifyPageTitleIsPresent()   — asserts page has a non-empty title
 *   verifyLoginUrlIsCorrect()    — asserts URL references the login path
 *   getLoginErrorMessage()       — returns error text (used internally + tests)
 */
export class LoginPage extends BasePage {
  // ── Selectors (private — never exposed to tests) ──────────────────────────
  // Selectors confirmed against live - login page DOM
  private readonly selectors = {
    username:    'input[name="username"]',                    // <input name="username" type="TEXT">
    password:    '#Password',                                // <input id="Password" type="PASSWORD">
    loginButton: 'input[type="submit"]',                     // <input type="SUBMIT" value="Click Here To Login">
    errorMessage: '.error-message, .alert-danger, p.error',  // fallback — update once a failed login is observed
  };

  constructor(page: Page) {
    super(page);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Navigate to the configured login URL for the current environment. */
  async navigate(): Promise<void> {
    this.logger.info(`[LoginPage] Navigating to login page: ${config.loginUrl}`);
    await this.navigateTo(config.loginUrl);
  }

  /**
   * Complete login flow: fills username, password and submits the form.
   * This is the single entry-point for tests — no test should call
   * enterUsername / enterPassword individually.
   */
  async login(username: string, password: string): Promise<void> {
    this.logger.info(`[LoginPage] Logging in as: ${username}`);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
    this.logger.info('[LoginPage] Login form submitted');
  }

  // ── Assertions (public verify* methods used by tests) ─────────────────────

  /** Assert the login form is visible on the current page. */
  async verifyLoginPageIsDisplayed(): Promise<void> {
    this.logger.info('[LoginPage] Verifying login page is displayed');
    const button = this.page.locator(this.selectors.loginButton);
    await this.assertVisible(button, 'login button');
  }

  /**
   * Assert that login was rejected.
   * Primary check: the browser must still be on the login page (URL contains 'Login').
   * Secondary: if the app renders an error message, its text is logged (non-blocking).
   */
  async verifyLoginFailed(): Promise<void> {
    this.logger.info('[LoginPage] Verifying login was rejected');

    // Definitive indicator — failed login keeps the browser on the login URL
    await this.assertUrlContains('Login');

    // Log error message text if the app renders one (no assertion — selector may vary)
    const errorMsg = await this.getLoginErrorMessage();
    if (errorMsg) {
      this.logger.info(`[LoginPage] Error message displayed: "${errorMsg}"`);
    }

    this.logger.info('[LoginPage] ✔ Login correctly rejected — user is still on the login page');
  }

  /** Assert the page title is not empty. */
  async verifyPageTitleIsPresent(): Promise<void> {
    this.logger.info('[LoginPage] Verifying page title is present');
    await this.assertTitleNotEmpty();
  }

  /** Assert the current URL refers to the login path. */
  async verifyLoginUrlIsCorrect(): Promise<void> {
    this.logger.info('[LoginPage] Verifying URL references login');
    await this.assertUrlContains('Login');
  }

  // ── Private helpers (used only within this class) ─────────────────────────

  private async enterUsername(username: string): Promise<void> {
    const field = this.page.locator(this.selectors.username);
    await this.typeText(field, username, 'username field');
  }

  private async enterPassword(password: string): Promise<void> {
    const field = this.page.locator(this.selectors.password);
    await this.typeText(field, password, 'password field');
  }

  private async clickLoginButton(): Promise<void> {
    const button = this.page.locator(this.selectors.loginButton);
    await this.clickElement(button, 'login button');
  }

  private async isLoginPageVisible(): Promise<boolean> {
    try {
      const button = this.page.locator(this.selectors.loginButton);
      return this.isVisible(button, 'login button');
    } catch {
      return false;
    }
  }

  async getLoginErrorMessage(): Promise<string> {
    try {
      const errorEl = this.page.locator(this.selectors.errorMessage).first();
      // Short timeout — error element may not exist; don't block the test for 15 s
      await errorEl.waitFor({ state: 'visible', timeout: 3000 });
      return (await errorEl.textContent() ?? '').trim();
    } catch {
      return '';
    }
  }
}

