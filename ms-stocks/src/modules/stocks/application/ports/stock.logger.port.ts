export interface StockLoggerPort {
  error(message: string, trace?: unknown, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  log(message: string, ...meta: unknown[]): void;
  verbose(message: string, ...meta: unknown[]): void;
}

export const STOCK_LOGGER = Symbol('STOCK_LOGGER');
