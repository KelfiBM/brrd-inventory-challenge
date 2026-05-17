import { DuplicatedProductError } from './duplicated-product.error';

describe('DuplicatedProductError', () => {
  it('should create an error with custom message', () => {
    const error = new DuplicatedProductError('Product with SKU already exists');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Product with SKU already exists');
    expect(error.name).toBe('DuplicatedProductError');
  });

  it('should create an error with default message when no message provided', () => {
    const error = new DuplicatedProductError();

    expect(error.message).toBe('Product already exists.');
  });

  it('should extend Error class', () => {
    const error = new DuplicatedProductError('Test error');

    expect(error instanceof Error).toBe(true);
  });
});
