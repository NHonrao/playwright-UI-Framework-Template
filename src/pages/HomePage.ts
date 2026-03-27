import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage — Page Object for the DDMS Home / Dashboard screen.
 *
 * OOP Principles applied:
 *  - Encapsulation : All selectors are private. Tests call only public verify*
 *                    / action methods.
 *  - Single Responsibility: Owns everything about the Home/Dashboard page.
 *  - Inheritance  : Inherits BasePage assertion helpers so no duplication.
 *
 * Public API surface (what tests call):
 *   verifyHomeIsVisible()     — asserts the home page loaded successfully
 *   verifyUserIsLoggedIn()    — asserts navigation + logout link are present
 *   verifyNavigationIsVisible() — asserts the nav bar is visible
 *   logout()                  — performs the logout flow
 *   isLogoutVisible()         — boolean check (used in fixtures/teardown)
 *   getWelcomeText()          — returns welcome heading text
 */
export class HomePage extends BasePage {
  // Selectors confirmed against live DDMS home page DOM (post-login URL: /ddms2/home/)
  private readonly selectors = {
    // <a class="lnava" href="/DDMS2/Home/?SiteName=DDMS">HOME</a>  — active nav item for Home
    homeIndicator: 'a.lnava',
    // <h2 class="home">Welcome to the DDMS Home Page</h2>  — welcome heading
    welcomeHeading: 'h2.home',
    // <p class="navmenus"> containing all .lnav links — only rendered when authenticated
    navigation: 'p.navmenus',
    // <a class="logout button" href="/Security/Logout.asp">Log out</a>
    logout: 'a.logout',
  };

  constructor(page: Page) {
    super(page);
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /**
   * Assert the Home page loaded successfully.
   * Waits up to 30 s for any known home-page indicator to appear.
   */
  /** Assert the Home page loaded — checks the active Home nav item is present. */
  async verifyHomeIsVisible(): Promise<void> {
    this.logger.info('[HomePage] Verifying Home page is visible');
    await this.assertVisible(this.page.locator(this.selectors.homeIndicator), 'Home nav link (a.lnava)');
    this.logger.info('[HomePage] ✔ Home page is visible');
  }

  /**
   * Assert the user is logged in.
   * p.navmenus and a.logout are only rendered for authenticated sessions.
   */
  async verifyUserIsLoggedIn(): Promise<void> {
    this.logger.info('[HomePage] Verifying user is logged in');
    await this.assertVisible(this.page.locator(this.selectors.navigation), 'navigation bar (p.navmenus)');
    await this.assertVisible(this.page.locator(this.selectors.logout), 'logout link (a.logout)');
    this.logger.info('[HomePage] ✔ User is logged in');
  }

  /** Assert the navigation bar (p.navmenus) is visible. */
  async verifyNavigationIsVisible(): Promise<void> {
    this.logger.info('[HomePage] Verifying navigation is visible');
    await this.assertVisible(this.page.locator(this.selectors.navigation), 'navigation bar (p.navmenus)');
    this.logger.info('[HomePage] ✔ Navigation is visible');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Click a.logout and wait for the browser to return to the login page. */
  async logout(): Promise<void> {
    this.logger.info('[HomePage] Performing logout');
    try {
      await this.clickElement(this.page.locator(this.selectors.logout), 'logout link (a.logout)');
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      this.logger.info('[HomePage] ✔ Logout complete');
    } catch (error) {
      this.logger.warn(`[HomePage] Logout element not found — skipping. ${String(error)}`);
    }
  }

  /** Returns text of h2.home — "Welcome to the Home Page". */
  async getWelcomeText(): Promise<string> {
    try {
      return this.getText(this.page.locator(this.selectors.welcomeHeading), 'welcome heading (h2.home)');
    } catch {
      return '';
    }
  }

  /** Boolean check — used by fixtures/teardown, not directly by tests. */
  async isLogoutVisible(): Promise<boolean> {
    return this.isVisible(this.page.locator(this.selectors.logout), 'logout link (a.logout)');
  }
}

