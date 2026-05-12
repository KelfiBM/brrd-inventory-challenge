import { Injectable, Logger } from '@nestjs/common';
import { StockLoggerPort } from '../../../application/ports/stock.logger.port';

@Injectable()
export class NestStockLogger implements StockLoggerPort {
  private readonly logger = new Logger('StockLogger');

  error(message: string, trace?: unknown, ...meta: unknown[]): void {
    this.logger.error(message, trace as string, ...meta);
  }
  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }
  log(message: string, ...meta: unknown[]): void {
    this.logger.log(message, ...meta);
  }
  verbose(message: string, ...meta: unknown[]): void {
    this.logger.verbose(message, ...meta);
  }
}
