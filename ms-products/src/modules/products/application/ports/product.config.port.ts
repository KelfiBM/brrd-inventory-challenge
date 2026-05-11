export interface ProductConfigPort {
  defaultCurrency(): string;
}

export const PRODUCT_CONFIG = Symbol('PRODUCT_CONFIG');
