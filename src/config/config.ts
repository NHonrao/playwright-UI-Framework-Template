import dotenv from 'dotenv';
import path from 'path';

const env = process.env.TEST_ENV || 'tst';
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env,
  baseUrl:  process.env.BASE_URL  || '',
  loginUrl: process.env.LOGIN_URL || '',

  // Credentials — must be set in .env.{TEST_ENV}; no hardcoded fallbacks
  adminUsername: process.env.ADMIN_USERNAME || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // Timeouts
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
  navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
  elementTimeout: parseInt(process.env.ELEMENT_TIMEOUT || '15000'),

  // Database — populated from .env.{environment}
  db: {
    server: process.env.DB_SERVER || '',
    database: process.env.DB_NAME || '',
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '1433'),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
  },

  // Reporting paths
  screenshotDir: 'reports/screenshots',
  logDir: 'reports/logs',
};
