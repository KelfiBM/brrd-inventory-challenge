export interface ProductConfigPort {
  defaultCurrency: string;
  cacheTtl: number;
}

export const PRODUCT_CONFIG = Symbol('PRODUCT_CONFIG');
