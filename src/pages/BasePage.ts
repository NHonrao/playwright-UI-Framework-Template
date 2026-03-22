import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../utils/Logger';
import { config } from '../config/config';

/**
 * BasePage — Abstract base class for all Page Object Models.
 *
 * OOP Principles applied:
 *  - Abstraction  : Defines a common interface every page must honour.
 *  - Encapsulation: All low-level Playwright interactions (find, click, type,
 *                   wait) are hidden behind descriptive methods. Subclasses and
 *                   tests never call Playwright APIs directly.
 *  - Inheritance  : Subclasses gain all interaction + assertion helpers for free.
 *  - Single Responsibility: Each method does exactly one thing.
 */
export abstract class BasePage {
  protected page: Page;
  protected logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  async navigateTo(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeout });
    this.logger.info(`Page loaded: ${this.page.url()}`);
  }

  async clickElement(locator: Locator, description: string): Promise<void> {
    this.logger.info(`Clicking: ${description}`);
    await locator.waitFor({ state: 'visible', timeout: config.elementTimeout });
    await locator.click();
    this.logger.info(`Clicked: ${description}`);
  }

  async typeText(locator: Locator, text: string, description: string): Promise<void> {
    this.logger.info(`Typing into ${description}`);
    await locator.waitFor({ state: 'visible', timeout: config.elementTimeout });
    await locator.clear();
    await locator.fill(text);
    this.logger.info(`Filled ${description}`);
  }

  async getText(locator: Locator, description: string): Promise<string> {
    this.logger.info(`Getting text from: ${description}`);
    await locator.waitFor({ state: 'visible', timeout: config.elementTimeout });
    const text = await locator.textContent();
    const trimmed = (text ?? '').trim();
    this.logger.info(`Text from ${description}: "${trimmed}"`);
    return trimmed;
  }

  async isVisible(locator: Locator, description: string): Promise<boolean> {
    try {
      // Short timeout — this is a boolean probe, not a test assertion.
      // Using the full elementTimeout (15 s) would make teardown very slow
      // when the element is genuinely absent (e.g. already logged out).
      await locator.waitFor({ state: 'visible', timeout: 3000 });
      this.logger.info(`${description} is visible`);
      return true;
    } catch {
      this.logger.warn(`${description} is NOT visible`);
      return false;
    }
  }

  async waitForPageLoad(timeout = config.navigationTimeout): Promise<void> {
    this.logger.info('Waiting for page network idle...');
    await this.page.waitForLoadState('networkidle', { timeout });
    this.logger.info('Page is fully loaded');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    const buf = await this.page.screenshot({ fullPage: true });
    this.logger.info(`Screenshot taken: ${name}`);
    return buf;
  }

  async verifyText(locator: Locator, expectedText: string, description: string): Promise<void> {
    this.logger.info(`Verifying text in ${description}: expected "${expectedText}"`);
    await expect(locator).toContainText(expectedText, { timeout: config.elementTimeout });
    this.logger.info(`Text verified for ${description}`);
  }

  async verifyUrl(expectedUrlFragment: string): Promise<void> {
    this.logger.info(`Verifying URL contains: ${expectedUrlFragment}`);
    await expect(this.page).toHaveURL(new RegExp(expectedUrlFragment), { timeout: config.navigationTimeout });
    this.logger.info('URL verified');
  }

  async selectFromDropdown(locator: Locator, value: string, description: string): Promise<void> {
    this.logger.info(`Selecting "${value}" from ${description}`);
    await locator.waitFor({ state: 'visible', timeout: config.elementTimeout });
    await locator.selectOption(value);
    this.logger.info(`Selected "${value}" from ${description}`);
  }

  async pressKey(key: string): Promise<void> {
    this.logger.info(`Pressing key: ${key}`);
    await this.page.keyboard.press(key);
  }

  // ── Protected assertion helpers (inherited by every Page class) ─────────────
  // These are the building blocks that subclasses compose into rich
  // public verify*() methods. Tests never call these directly.

  protected async assertVisible(locator: Locator, description: string): Promise<void> {
    this.logger.info(`Asserting visible: ${description}`);
    await expect(locator).toBeVisible({ timeout: config.elementTimeout });
    this.logger.info(`✔ Visible: ${description}`);
  }

  protected async assertNotVisible(locator: Locator, description: string): Promise<void> {
    this.logger.info(`Asserting NOT visible: ${description}`);
    await expect(locator).not.toBeVisible({ timeout: config.elementTimeout });
    this.logger.info(`✔ Not visible: ${description}`);
  }

  protected async assertContainsText(locator: Locator, expected: string, description: string): Promise<void> {
    this.logger.info(`Asserting text in ${description}: "${expected}"`);
    await expect(locator).toContainText(expected, { timeout: config.elementTimeout });
    this.logger.info(`✔ Text found in ${description}`);
  }

  protected async assertUrlContains(fragment: string): Promise<void> {
    this.logger.info(`Asserting URL contains: "${fragment}"`);
    await expect(this.page).toHaveURL(new RegExp(fragment, 'i'), { timeout: config.navigationTimeout });
    this.logger.info(`✔ URL contains: "${fragment}"`);
  }

  protected async assertTitleNotEmpty(): Promise<void> {
    const title = await this.page.title();
    this.logger.info(`Asserting page title is not empty — found: "${title}"`);
    expect(title.length, 'Page title should not be empty').toBeGreaterThan(0);
    this.logger.info('✔ Page title is present');
  }

}
