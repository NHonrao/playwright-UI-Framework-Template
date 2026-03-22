export type Environment = 'tst' | 'uat' | 'prod';

export interface EnvironmentConfig {
  baseUrl: string;
  loginUrl: string;
  apiUrl?: string;
  dbServer: string;
  dbName: string;
}

// These values are overridden at runtime by the active .env.{TEST_ENV} file.
// Update the environment files (.env.tst, .env.uat, .env.prod) with real values.
// Never commit real URLs or credentials here — use .env files (gitignored).
export const environments: Record<Environment, EnvironmentConfig> = {
  tst: {
    baseUrl:  'https://tst.your-app.example.com',
    loginUrl: 'https://tst.your-app.example.com/login',
    dbServer: 'tst-db-server.example.com',
    dbName:   'tst_database',
  },
  uat: {
    baseUrl:  'https://uat.your-app.example.com',
    loginUrl: 'https://uat.your-app.example.com/login',
    dbServer: 'uat-db-server.example.com',
    dbName:   'uat_database',
  },
  prod: {
    baseUrl:  'https://your-app.example.com',
    loginUrl: 'https://your-app.example.com/login',
    dbServer: 'prod-db-server.example.com',
    dbName:   'prod_database',
  },
};

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = (process.env.TEST_ENV || 'tst') as Environment;
  if (!environments[env]) {
    throw new Error(`Unknown environment: ${env}. Valid options: ${Object.keys(environments).join(', ')}`);
  }
  return environments[env];
}
