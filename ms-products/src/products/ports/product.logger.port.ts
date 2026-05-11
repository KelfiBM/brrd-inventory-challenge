export interface ProductLoggerPort {
  error(message: string, trace?: unknown, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  log(message: string, ...meta: unknown[]): void;
  verbose(message: string, ...meta: unknown[]): void;
}

export const PRODUCT_LOGGER = Symbol('PRODUCT_LOGGER');
