import { Product } from '../entities/product.entity';
import { Price } from '../value-objects/price.vo';
import { ProductCategory } from '../value-objects/product-category.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { ProductChangedEvent } from './product-changed.event';

describe('ProductChangedEvent', () => {
  it('should create an event with correlation ID and product', () => {
    const correlationId = '123e4567-e89b-12d3-a456-426614174000';
    const product = Product.create({
      id: new ProductId('product-123'),
      name: 'Test Product',
      description: 'A test product',
      price: new Price(100),
      categories: [new ProductCategory('Electronics')],
      sku: 'SKU-123',
    });

    const event = new ProductChangedEvent(correlationId, product);

    expect(event).toBeDefined();
    expect(event.data).toEqual(product);
    expect(event.metadata.correlationId.getValue()).toBe(correlationId);
    expect(event.metadata.timestamp).toBeInstanceOf(Date);
  });

  it('should throw error when product is null', () => {
    const correlationId = '123e4567-e89b-12d3-a456-426614174000';

    expect(() => new ProductChangedEvent(correlationId, null as any)).toThrow(
      'Domain event data cannot be null or undefined.'
    );
  });

  it('should use provided timestamp', () => {
    const correlationId = '123e4567-e89b-12d3-a456-426614174000';
    const customTimestamp = new Date('2024-01-01');
    const product = Product.create({
      id: new ProductId('product-123'),
      name: 'Test Product',
      description: 'A test product',
      price: new Price(100),
      categories: [new ProductCategory('Electronics')],
      sku: 'SKU-123',
    });

    const event = new ProductChangedEvent(correlationId, product, customTimestamp);

    expect(event.metadata.timestamp).toEqual(customTimestamp);
  });

  it('should extend DomainEvent', () => {
    const correlationId = '123e4567-e89b-12d3-a456-426614174000';
    const product = Product.create({
      id: new ProductId('product-123'),
      name: 'Test Product',
      description: 'A test product',
      price: new Price(100),
      categories: [new ProductCategory('Electronics')],
      sku: 'SKU-123',
    });

    const event = new ProductChangedEvent(correlationId, product);

    expect(event.metadata).toBeDefined();
    expect(event.data).toBeDefined();
  });
});
