import { Product } from '../../domain/entities/product.entity';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export interface ProductCacheRepositoryPort {
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findById(id: ProductId): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(id: ProductId): Promise<void>;
}

export const PRODUCT_CACHE_REPOSITORY = Symbol('PRODUCT_CACHE_REPOSITORY_PORT');
