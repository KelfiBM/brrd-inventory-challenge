import { Injectable, Logger } from '@nestjs/common';
import { ProductLoggerPort } from '../../../application/ports/product.logger.port';

@Injectable()
export class NestProductLogger implements ProductLoggerPort {
  private readonly logger = new Logger('ProductLogger');

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
