import { Product } from '../../domain/entities/product.entity';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export interface ProductRepositoryPort {
  getNextId(): Promise<ProductId>;
  findAll(): Promise<Product[]>;
  findByCategory(category: ProductCategory): Promise<Product[]>;
  findById(id: ProductId, includePriceHistory?: boolean): Promise<Product>;
  findBySku(sku: string): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(id: ProductId): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
