/**
 * Structured logging service for Koog-Luxor9 integration
 */

import * as winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.prettyPrint()
      ),
      defaultMeta: { service: 'koog-luxor9-integration' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add file transport in production
    if (process.env['NODE_ENV'] === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }));
      this.logger.add(new winston.transports.File({
        filename: 'logs/combined.log'
      }));
    }
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error | any): void {
    this.logger.error(message, error);
  }
}