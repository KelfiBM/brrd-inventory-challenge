import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  describe('constructor', () => {
    it('should create a valid product ID', () => {
      const id = new ProductId('123e4567-e89b-12d3-a456-426614174000');
      expect(id.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error when product ID is empty', () => {
      expect(() => new ProductId('')).toThrow('Product ID is required');
    });

    it('should throw error when product ID is undefined', () => {
      expect(() => new ProductId(undefined as any)).toThrow('Product ID is required');
    });

    it('should throw error when product ID is null', () => {
      expect(() => new ProductId(null as any)).toThrow('Product ID is required');
    });

    it('should accept any non-empty string as product ID', () => {
      const id = new ProductId('product-123');
      expect(id.getValue()).toBe('product-123');
    });
  });

  describe('equals', () => {
    it('should return true when product IDs have the same value', () => {
      const id1 = new ProductId('123e4567-e89b-12d3-a456-426614174000');
      const id2 = new ProductId('123e4567-e89b-12d3-a456-426614174000');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false when product IDs have different values', () => {
      const id1 = new ProductId('123e4567-e89b-12d3-a456-426614174000');
      const id2 = new ProductId('223e4567-e89b-12d3-a456-426614174000');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the product ID value', () => {
      const id = new ProductId('test-id-123');
      expect(id.getValue()).toBe('test-id-123');
    });
  });
});
