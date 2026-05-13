import { ProductDbEntity } from '../../infrastructure/adapters/product-repository/type-orm-product-repository/entities/product.db-entity';

export interface ProductCacheRepositoryPort {
  findAll(): Promise<ProductDbEntity[]>;
  saveAll(products: ProductDbEntity[]): Promise<void>;
  findByCategory(category: string): Promise<ProductDbEntity[]>;
  saveByCategory(category: string, products: ProductDbEntity[]): Promise<void>;
  findById(id: string): Promise<ProductDbEntity | null>;
  save(product: ProductDbEntity): Promise<ProductDbEntity>;
  remove(id: string): Promise<void>;

  getExchangeRateTable(forCurrency: string): Promise<{ [currency: string]: number }>;
  saveExchangeRateTable(forCurrency: string, rates: { [currency: string]: number }): Promise<void>;
}

export const PRODUCT_CACHE_REPOSITORY = Symbol('PRODUCT_CACHE_REPOSITORY_PORT');
