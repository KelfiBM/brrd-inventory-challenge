import { ProductNotChangedError } from './product-not-changed.error';

describe('ProductNotChangedError', () => {
  it('should create an error with message', () => {
    const error = new ProductNotChangedError('Product was not changed');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Product was not changed');
    expect(error.name).toBe('ProductNotChangedError');
  });

  it('should extend Error class', () => {
    const error = new ProductNotChangedError('Test error');

    expect(error instanceof Error).toBe(true);
  });
});
