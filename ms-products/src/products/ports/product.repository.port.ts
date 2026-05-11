import { Product } from '../entities/product.entity';
import { ProductCategory } from '../value-objects/product-category.vo';
import { ProductId } from '../value-objects/product-id.vo';

export interface ProductRepositoryPort {
  getNextId(): Promise<ProductId>;
  findAll(): Promise<Product[]>;
  saveAll(products: Product[]): Promise<void>;
  findByCategory(category: ProductCategory): Promise<Product[]>;
  saveByCategory(category: ProductCategory, products: Product[]): Promise<void>;
  findById(id: ProductId, includePriceHistory?: boolean): Promise<Product>;
  findBySku(sku: string): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(id: ProductId): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
