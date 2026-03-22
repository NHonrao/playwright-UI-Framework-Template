import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Logger } from './Logger';

export class ScreenshotHelper {
  private page: Page;
  private logger: Logger;
  private screenshotDir: string;

  constructor(page: Page, screenshotDir = 'reports/screenshots') {
    this.page = page;
    this.logger = new Logger('ScreenshotHelper');
    this.screenshotDir = screenshotDir;
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async takeScreenshot(name: string, fullPage = true): Promise<string> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.screenshotDir, `${safeName}_${ts}.png`);

    this.logger.info(`Taking screenshot: ${filePath}`);
    await this.page.screenshot({ path: filePath, fullPage });
    this.logger.info(`Screenshot saved: ${filePath}`);
    return filePath;
  }

  async takeFailureScreenshot(testName: string): Promise<string> {
    const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return this.takeScreenshot(`FAILURE_${safeName}`, true);
  }

  async takeElementScreenshot(selector: string, name: string): Promise<string> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.screenshotDir, `${name}_${ts}.png`);

    try {
      const el = this.page.locator(selector).first();
      await el.screenshot({ path: filePath });
      this.logger.info(`Element screenshot saved: ${filePath}`);
    } catch {
      this.logger.warn(`Element not found for screenshot — falling back to full page`);
      await this.page.screenshot({ path: filePath, fullPage: true });
    }
    return filePath;
  }
}
