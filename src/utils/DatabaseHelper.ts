import * as sql from 'mssql';
import { Logger } from './Logger';
import { config } from '../config/config';

export class DatabaseHelper {
  private pool: sql.ConnectionPool | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DatabaseHelper');
  }

  private getConnectionConfig(): sql.config {
    return {
      server: config.db.server,
      database: config.db.database,
      user: config.db.username,
      password: config.db.password,
      port: config.db.port,
      options: {
        encrypt: config.db.encrypt,
        trustServerCertificate: config.db.trustServerCertificate,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    };
  }

  async connect(): Promise<void> {
    if (this.pool?.connected) return;

    this.logger.info(`Connecting to database: ${config.db.server}/${config.db.database}`);
    try {
      this.pool = await sql.connect(this.getConnectionConfig());
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.logger.info('Database connection closed');
    }
  }

  /**
   * Execute a parameterized SELECT query and return all rows.
   * Parameters are key-value pairs injected via sql.Request.input() to prevent SQL injection.
   */
  async executeQuery<T>(query: string, parameters?: Record<string, unknown>): Promise<T[]> {
    await this.connect();
    try {
      this.logger.info(`Executing query: ${query.substring(0, 120)}...`);
      const request = this.pool!.request();

      if (parameters) {
        for (const [key, value] of Object.entries(parameters)) {
          request.input(key, value);
        }
      }

      const result: sql.IResult<T> = await request.query(query);
      this.logger.info(`Query returned ${result.recordset.length} row(s)`);
      return result.recordset;
    } catch (error) {
      this.logger.error('Query execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute a query expected to return a single scalar value.
   */
  async executeScalar<T>(query: string, parameters?: Record<string, unknown>): Promise<T | null> {
    const rows = await this.executeQuery<Record<string, T>>(query, parameters);
    if (rows.length === 0) return null;
    const values = Object.values(rows[0]);
    return values.length > 0 ? values[0] : null;
  }

  /**
   * Execute a stored procedure and return all rows.
   */
  async executeProcedure<T>(procedureName: string, parameters?: Record<string, unknown>): Promise<T[]> {
    await this.connect();
    try {
      this.logger.info(`Executing stored procedure: ${procedureName}`);
      const request = this.pool!.request();

      if (parameters) {
        for (const [key, value] of Object.entries(parameters)) {
          request.input(key, value);
        }
      }

      // IProcedureResult has a slightly different type signature — cast via unknown
      const result = (await request.execute(procedureName)) as unknown as sql.IResult<T>;
      this.logger.info(`Procedure returned ${result.recordset.length} row(s)`);
      return result.recordset;
    } catch (error) {
      this.logger.error(`Procedure execution failed: ${procedureName}`, error as Error);
      throw error;
    }
  }
}
