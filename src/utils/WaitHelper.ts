import { Page } from '@playwright/test';
import { Logger } from './Logger';

export class WaitHelper {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('WaitHelper');
  }

  async waitForSeconds(seconds: number): Promise<void> {
    this.logger.info(`Waiting ${seconds}s`);
    await this.page.waitForTimeout(seconds * 1000);
  }

  async waitForMilliseconds(ms: number): Promise<void> {
    this.logger.debug(`Waiting ${ms}ms`);
    await this.page.waitForTimeout(ms);
  }

  async waitForNetworkIdle(timeout = 30000): Promise<void> {
    this.logger.info('Waiting for network idle');
    await this.page.waitForLoadState('networkidle', { timeout });
    this.logger.info('Network is idle');
  }

  async waitForDomLoaded(timeout = 30000): Promise<void> {
    this.logger.info('Waiting for DOM content loaded');
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    this.logger.info('DOM content loaded');
  }

  async waitForSelector(selector: string, timeout = 30000): Promise<void> {
    this.logger.info(`Waiting for selector: ${selector}`);
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    this.logger.info(`Selector found: ${selector}`);
  }

  async waitForUrl(urlPattern: string | RegExp, timeout = 30000): Promise<void> {
    this.logger.info(`Waiting for URL: ${urlPattern}`);
    await this.page.waitForURL(urlPattern, { timeout });
    this.logger.info(`URL matched: ${this.page.url()}`);
  }

  async waitForText(text: string, timeout = 30000): Promise<void> {
    this.logger.info(`Waiting for text: "${text}"`);
    await this.page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
    this.logger.info(`Text found: "${text}"`);
  }

  /**
   * Retries an async action up to maxRetries times with delay between attempts.
   */
  async retryAction<T>(
    action: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000,
    description = 'action'
  ): Promise<T> {
    let lastError: Error = new Error('No attempts made');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`${description} — attempt ${attempt}/${maxRetries}`);
        const result = await action();
        this.logger.info(`${description} succeeded on attempt ${attempt}`);
        return result;
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`${description} failed (attempt ${attempt}): ${lastError.message}`);
        if (attempt < maxRetries) {
          await this.waitForMilliseconds(delayMs);
        }
      }
    }
    throw new Error(`${description} failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}
