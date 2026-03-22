# Playwright Framework Template

Robust end-to-end test automation framework built with **Playwright** + **TypeScript**.  
Supports multi-browser, multi-environment, parallel execution, Allure reporting, MSSQL integration and Azure DevOps pipelines.

---

## Project Structure

```
PlaywrightFrameworkTemplate/
├── src/
│   ├── config/
│   │   ├── config.ts            # Central config (reads from .env files)
│   │   └── environments.ts      # Per-environment URL/DB mappings
│   ├── pages/                   # Page Object Model classes
│   │   ├── BasePage.ts          # Shared page methods + smart element finder
│   │   ├── LoginPage.ts         # DDMS Login page
│   │   └── HomePage.ts          # DDMS Home page
│   ├── utils/
│   │   ├── Logger.ts            # Winston-based structured logger
│   │   ├── WaitHelper.ts        # Wait strategies + retry helper
│   │   ├── ScreenshotHelper.ts  # Screenshot capture utility
│   │   ├── DatabaseHelper.ts    # MSSQL query executor
│   │   └── TestDataManager.ts   # JSON test data loader with cache
│   ├── fixtures/
│   │   ├── customFixtures.ts    # Extended Playwright fixtures (POM + helpers)
│   │   └── hooks.ts             # Shared beforeAll/beforeEach/afterEach/afterAll hooks
│   ├── data/
│   │   ├── users.json           # User credentials per role
│   │   └── testData.json        # General test data
│   └── tests/
│       └── auth/
│           └── login.spec.ts    # DDMS login test suite
├── reports/                     # Generated at runtime
│   ├── screenshots/             # Failure screenshots
│   ├── logs/                    # Winston log files
│   └── junit-results.xml        # JUnit results for ADO
├── playwright-report/           # Playwright HTML report (auto-generated)
├── allure-results/              # Raw Allure data
├── allure-report/               # Generated Allure HTML report
├── .env                         # Shared defaults (committed)
├── .env.tst                     # TST secrets (NOT committed)
├── .env.uat                     # UAT secrets (NOT committed)
├── playwright.config.ts         # Playwright configuration
├── tsconfig.json                # TypeScript configuration
├── azure-pipelines.yml          # Azure DevOps CI/CD pipeline
└── package.json
```

---

## Prerequisites

- **Node.js** 18+ / **npm** 9+
- **Java 11+** (required by `allure-commandline` for report generation)

---

## Quick Start

```bash
# 1. Install dependencies
npm ci

# 2. Install Playwright browsers
npx playwright install --with-deps

# 3. Copy and populate environment file
cp .env.tst.example .env.tst   # then fill in real values

# 4. Run all tests (TST environment, all browsers)
npm test

# 5. Run on a specific browser
npm run test:chrome
npm run test:firefox
npm run test:webkit

# 6. Run in a specific environment
npm run test:tst
npm run test:uat
npm run test:prod

# 7. Open Playwright HTML report
npm run report

# 8. Generate & open Allure report
npm run allure:generate
npm run allure:open
```

---

## Environment Configuration

Environment variables are loaded from `.env.{TEST_ENV}` then `.env` (defaults).  
Set `TEST_ENV` to switch environments:

| Variable             | Description                       |
|----------------------|-----------------------------------|
| `TEST_ENV`           | `tst` / `uat` / `prod`            |
| `BASE_URL`           | Application base URL              |
| `LOGIN_URL`          | Full login page URL               |
| `ADMIN_USERNAME`     | Test user username                |
| `ADMIN_PASSWORD`     | Test user password                |
| `DB_SERVER`          | SQL Server host                   |
| `DB_NAME`            | Database name                     |
| `DB_USERNAME`        | DB user                           |
| `DB_PASSWORD`        | DB password                       |
| `LOG_LEVEL`          | `info` / `debug` / `warn`         |

> **.env.tst / .env.uat / .env.prod are in `.gitignore`** — never commit secrets.

---

## Framework Features

| Feature | Details |
|---|---|
| **POM Pattern** | `BasePage` → `LoginPage`, `HomePage` |
| **Smart selectors** | Single DOM-confirmed CSS selector per element; no guessing |
| **Parallel execution** | `fullyParallel: true`; configurable worker count |
| **Multi-browser** | Chromium, Firefox, WebKit |
| **Multi-environment** | TST / UAT / PROD via `TEST_ENV` |
| **Allure reporting** | Step-level detail, screenshots, categories, severity labels |
| **Playwright HTML report** | Visual test run summary |
| **JUnit results** | Parsed by Azure DevOps test dashboard |
| **Screenshots on failure** | Auto-captured to `reports/screenshots/` |
| **Video on retry** | Recorded on first retry (`video: 'on-first-retry'`) |
| **Trace on retry** | `trace: 'on-first-retry'` for debugging |
| **Winston logging** | Console + rolling log files in `reports/logs/` |
| **MSSQL integration** | `DatabaseHelper` — parameterised queries + stored procedures |
| **Custom fixtures** | Pre-built page objects and helpers via `customFixtures.ts` — `loginPage`, `homePage`, `screenshotHelper`, `waitHelper`, `dbHelper`, `testDataManager`, `authenticatedPage` |
| **Retry logic** | `WaitHelper.retryAction()` for flaky operations |
| **ADO pipeline** | `azure-pipelines.yml` — install, run, publish reports |

---

## Writing a New Test

All tests import `test` from `customFixtures`, not from `@playwright/test` directly.
Call `applyCommonHooks()` once at the top of the describe block to get all lifecycle
hooks (logging, Allure labels, failure screenshots) without any boilerplate.

```typescript
import { test } from '../../fixtures/customFixtures';
import { allure } from 'allure-playwright';
import { applyCommonHooks } from '../../fixtures/hooks';

test.describe('My Feature Tests', () => {
  applyCommonHooks(test, {
    suiteName:   'My Feature Tests',
    parentSuite: 'My App Suite',
    suite:       'My Feature',
    subSuite:    'My Scenario',
  });

  test('TC004 - Verify home page after login', async ({ loginPage, homePage, testDataManager }) => {
    allure.epic('My App');
    allure.feature('Authentication');
    allure.story('Successful Login');
    allure.severity('critical');
    allure.tag('smoke');

    // Arrange
    const user = testDataManager.getUserData('admin');

    // Act
    await test.step('Navigate to login page', async () => {
      await loginPage.navigate();
    });
    await test.step('Login with valid credentials', async () => {
      await loginPage.login(user.username, user.password);
    });

    // Assert
    await test.step('Verify home page is visible', async () => {
      await homePage.verifyHomeIsVisible();
    });
    await test.step('Verify user is logged in', async () => {
      await homePage.verifyUserIsLoggedIn();
    });
  });
});
```

---

## Shared Hooks

`src/fixtures/hooks.ts` exports `applyCommonHooks(test, options)`. Call it once at the
top of any `test.describe` block and every test in that suite automatically gets:

- `beforeAll` — logs suite name, environment and base URL
- `beforeEach` — logs test start; applies Allure suite hierarchy + runtime parameters
- `afterEach` — logs pass/fail; on failure saves screenshot to disk and attaches it
  inline to the Allure report along with the failure page URL
- `afterAll` — logs suite end

No `beforeEach` / `afterEach` blocks should appear inside individual test files.

---

## Adding a New Page Object

1. Create `src/pages/MyPage.ts` extending `BasePage`.
2. Add a `private readonly selectors` object with **DOM-confirmed** CSS selectors — inspect the live page first.
3. Write `public verify*()` methods using `this.assertVisible()` etc.
4. Write `public` action methods using `this.clickElement()`, `this.typeText()` etc.
5. Add the fixture to `customFixtures.ts`.

```typescript
// src/pages/MyPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  // Confirm each selector against the real live page DOM before writing it here.
  private readonly selectors = {
    heading:   'h1.page-title',   // confirmed via browser inspect
    saveButton: 'button#save',     // confirmed via browser inspect
  };

  constructor(page: Page) {
    super(page);
  }

  // Public verify* methods — what tests call
  async verifyHeadingIsVisible(): Promise<void> {
    this.logger.info('[MyPage] Verifying heading is visible');
    await this.assertVisible(this.page.locator(this.selectors.heading), 'page heading');
    this.logger.info('[MyPage] ✔ Heading is visible');
  }

  // Public action methods — what tests call
  async clickSave(): Promise<void> {
    this.logger.info('[MyPage] Clicking Save');
    await this.clickElement(this.page.locator(this.selectors.saveButton), 'save button');
  }
}
```

## Database Usage

```typescript
// Inside a test using the dbHelper fixture
const rows = await dbHelper.executeQuery<{ Id: number; Name: string }>(
  'SELECT TOP 10 Id, Name FROM Users WHERE Active = @active',
  { active: 1 }
);
```

---

## Azure DevOps Pipeline

The `azure-pipelines.yml` pipeline:

1. Checks out code
2. Installs Node.js and npm dependencies
3. Installs Playwright browsers with OS dependencies
4. Writes `.env.tst` from ADO pipeline secret variables
5. Runs Playwright tests with `CI=true` (4 workers, 2 retries)
6. Publishes JUnit results to ADO test dashboard
7. Generates and publishes Allure HTML report artifact
8. Publishes Playwright HTML report artifact
9. Publishes failure screenshots (on failure only)
10. Publishes Winston log files

**Required ADO pipeline variables** (store as secret):  
`BASE_URL`, `LOGIN_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DB_SERVER`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
