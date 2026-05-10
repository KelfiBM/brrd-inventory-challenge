export interface ProductLoggerPort {
  fatal(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  log(message: string): void;
  debug(message: string): void;
  verbose(message: string): void;
}

export const PRODUCT_LOGGER = Symbol('PRODUCT_LOGGER');
