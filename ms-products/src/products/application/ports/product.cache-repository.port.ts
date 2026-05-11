import { Product } from '../../domain/entities/product.entity';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export interface ProductCacheRepositoryPort {
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  remove(id: ProductId): Promise<void>;

  getExchangeRateTable(forCurrency: string): Promise<{ [currency: string]: number }>;
  saveExchangeRateTable(forCurrency: string, rates: { [currency: string]: number }): Promise<void>;
}

export const PRODUCT_CACHE_REPOSITORY = Symbol('PRODUCT_CACHE_REPOSITORY_PORT');
