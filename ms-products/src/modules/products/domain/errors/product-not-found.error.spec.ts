import { ProductNotFoundError } from './product-not-found.error';

describe('ProductNotFoundError', () => {
  it('should create an error with message and product ID', () => {
    const error = new ProductNotFoundError('Product not found', 'product-123');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Product not found');
    expect(error.name).toBe('ProductNotFoundError');
    expect(error.productId).toBe('product-123');
  });

  it('should create an error with message only', () => {
    const error = new ProductNotFoundError('Product not found');

    expect(error.message).toBe('Product not found');
    expect(error.productId).toBeUndefined();
  });

  it('should extend Error class', () => {
    const error = new ProductNotFoundError('Test error');

    expect(error instanceof Error).toBe(true);
  });
});
