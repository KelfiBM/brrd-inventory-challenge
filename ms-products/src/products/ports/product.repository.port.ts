import { Product } from '../entities/product.entity';
import { ProductId } from '../value-objects/product-id.vo';

export interface ProductRepositoryPort {
  getNextId(): Promise<ProductId>;
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findById(id: ProductId): Promise<Product>;
  findBySku(sku: string): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(id: ProductId): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
