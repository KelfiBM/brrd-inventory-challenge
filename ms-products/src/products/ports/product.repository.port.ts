import { Product } from '../entities/product.entity';

export interface ProductRepositoryPort {
  getNextId(): Promise<string>;
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findOne(id: string): Promise<Product>;
  save(product: Product): Promise<Product>;
  remove(id: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
