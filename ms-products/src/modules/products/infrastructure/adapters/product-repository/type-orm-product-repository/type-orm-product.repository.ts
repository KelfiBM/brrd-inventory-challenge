import { randomUUID } from 'node:crypto';
import { ProductRepositoryPort } from '../../../../application/ports/product.repository.port';
import { Product } from '../../../../domain/entities/product.entity';
import { ProductCategory } from '../../../../domain/value-objects/product-category.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';

export class TypeOrmProductRepository implements ProductRepositoryPort {
  getNextId(): Promise<ProductId> {
    return Promise.resolve(new ProductId(randomUUID()));
  }
  findAll(): Promise<Product[]> {
    throw new Error('Method not implemented.');
  }
  saveAll(products: Product[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findByCategory(category: ProductCategory): Promise<Product[]> {
    throw new Error('Method not implemented.');
  }
  saveByCategory(category: ProductCategory, products: Product[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: ProductId, includePriceHistory?: boolean): Promise<Product> {
    throw new Error('Method not implemented.');
  }
  findBySku(sku: string): Promise<Product> {
    throw new Error('Method not implemented.');
  }
  save(product: Product): Promise<Product> {
    throw new Error('Method not implemented.');
  }
  remove(id: ProductId): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
