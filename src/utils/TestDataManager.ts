import fs from 'fs';
import path from 'path';
import { Logger } from './Logger';

interface UsersData {
  [key: string]: { username: string; password: string };
}

export class TestDataManager {
  private logger: Logger;
  private dataCache = new Map<string, unknown>();

  constructor() {
    this.logger = new Logger('TestDataManager');
  }

  loadJsonFile<T>(filePath: string): T {
    const resolved = path.resolve(filePath);

    if (this.dataCache.has(resolved)) {
      this.logger.debug(`Cache hit: ${resolved}`);
      return this.dataCache.get(resolved) as T;
    }

    if (!fs.existsSync(resolved)) {
      throw new Error(`Test data file not found: ${resolved}`);
    }

    this.logger.info(`Loading test data: ${resolved}`);
    const content = fs.readFileSync(resolved, 'utf8');
    const data = JSON.parse(content) as T;
    this.dataCache.set(resolved, data);
    return data;
  }

  /**
   * Returns credentials for the given user type.
   *
   * Resolution order (most specific wins):
   *   1. Environment variables  — {USERTYPE}_USERNAME / {USERTYPE}_PASSWORD
   *      e.g.  ADMIN_USERNAME / ADMIN_PASSWORD  for userType='admin'
   *      These are loaded from the active .env.{TEST_ENV} file by config.ts.
   *   2. users.json fallback    — safe to commit because it holds placeholders only.
   *
   * This keeps real credentials out of source control while still allowing
   * tests to request user data by logical type name.
   */
  getUserData(userType = 'admin'): { username: string; password: string } {
    const users = this.loadJsonFile<UsersData>(path.join(__dirname, '../data/users.json'));
    if (!users[userType]) {
      throw new Error(`User type "${userType}" not found in users.json`);
    }

    const envPrefix = userType.toUpperCase();
    const username = process.env[`${envPrefix}_USERNAME`] ?? users[userType].username;
    const password = process.env[`${envPrefix}_PASSWORD`] ?? users[userType].password;

    this.logger.debug(`Resolved credentials for user type "${userType}" (source: ${
      process.env[`${envPrefix}_USERNAME`] ? 'env vars' : 'users.json'
    })`);

    return { username, password };
  }

  getTestData<T>(key: string): T {
    const testData = this.loadJsonFile<Record<string, T>>(path.join(__dirname, '../data/testData.json'));
    if (!(key in testData)) {
      throw new Error(`Key "${key}" not found in testData.json`);
    }
    return testData[key];
  }

  clearCache(): void {
    this.dataCache.clear();
    this.logger.debug('Test data cache cleared');
  }
}
