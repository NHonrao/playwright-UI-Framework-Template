import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = 'reports/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp: ts, level, message, context, stack }) => {
    const ctx = context ? `[${context}]` : '';
    const stackTrace = stack ? `\n${stack}` : '';
    return `${ts} [${level.toUpperCase().padEnd(5)}] ${ctx} ${message}${stackTrace}`;
  })
);

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, `test-run-${timestamp}.log`),
    }),
  ],
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    winstonLogger.info(message, { context: this.context });
  }

  warn(message: string): void {
    winstonLogger.warn(message, { context: this.context });
  }

  error(message: string, error?: Error): void {
    winstonLogger.error(message, { context: this.context, stack: error?.stack });
  }

  debug(message: string): void {
    winstonLogger.debug(message, { context: this.context });
  }

  step(stepNumber: number, description: string): void {
    winstonLogger.info(`[STEP ${stepNumber}] ${description}`, { context: this.context });
  }
}
