import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  describe('constructor', () => {
    it('should create instance with valid product id', () => {
      const id = new ProductId('prod-123');
      expect(id).toBeDefined();
      expect(id.getValue()).toBe('prod-123');
    });

    it('should create instance with UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new ProductId(uuid);
      expect(id.getValue()).toBe(uuid);
    });

    it('should create instance with SKU', () => {
      const id = new ProductId('SKU-12345-ABC');
      expect(id.getValue()).toBe('SKU-12345-ABC');
    });

    it('should create instance with numeric string', () => {
      const id = new ProductId('98765');
      expect(id.getValue()).toBe('98765');
    });

    it('should create instance with long string', () => {
      const longId = 'product-'.repeat(100);
      const id = new ProductId(longId);
      expect(id.getValue()).toBe(longId);
    });

    it('should create instance with special characters', () => {
      const id = new ProductId('prod-_-~-456');
      expect(id.getValue()).toBe('prod-_-~-456');
    });

    it('should throw error for null', () => {
      expect(() => new ProductId(null as any)).toThrow(
        'Product ID is required',
      );
    });

    it('should throw error for undefined', () => {
      expect(() => new ProductId(undefined as any)).toThrow(
        'Product ID is required',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => new ProductId('')).toThrow('Product ID is required');
    });

    it('should accept whitespace strings as valid (non-empty)', () => {
      const id = new ProductId('   ');
      expect(id.getValue()).toBe('   ');
    });

    it('should throw error for false value', () => {
      expect(() => new ProductId(false as any)).toThrow(
        'Product ID is required',
      );
    });

    it('should throw error for zero', () => {
      expect(() => new ProductId(0 as any)).toThrow('Product ID is required');
    });
  });

  describe('getValue', () => {
    it('should return the product id', () => {
      const id = new ProductId('prod-789');
      expect(id.getValue()).toBe('prod-789');
    });

    it('should return UUID value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new ProductId(uuid);
      expect(id.getValue()).toBe(uuid);
    });

    it('should preserve exact string', () => {
      const idString = 'product-id-ABC123';
      const id = new ProductId(idString);
      expect(id.getValue()).toBe(idString);
    });

    it('should maintain case sensitivity', () => {
      const id = new ProductId('ProductId-MixedCase');
      expect(id.getValue()).toBe('ProductId-MixedCase');
    });

    it('should return immutable value', () => {
      const id = new ProductId('immutable-prod');
      const firstCall = id.getValue();
      const secondCall = id.getValue();
      expect(firstCall).toBe(secondCall);
    });

    it('should preserve value type as string', () => {
      const id = new ProductId('string-prod-id');
      const value = id.getValue();
      expect(typeof value).toBe('string');
    });
  });

  describe('equals', () => {
    it('should return true for same product id', () => {
      const id1 = new ProductId('prod-123');
      const id2 = new ProductId('prod-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different product ids', () => {
      const id1 = new ProductId('prod-123');
      const id2 = new ProductId('prod-456');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return true comparing UUID values', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new ProductId(uuid);
      const id2 = new ProductId(uuid);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should be case sensitive', () => {
      const id1 = new ProductId('PROD-ABC');
      const id2 = new ProductId('prod-abc');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false for similar but different strings', () => {
      const id1 = new ProductId('prod-123');
      const id2 = new ProductId('prod-1234');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should support chained equality checks', () => {
      const id1 = new ProductId('same-prod');
      const id2 = new ProductId('same-prod');
      const id3 = new ProductId('same-prod');
      expect(id1.equals(id2) && id2.equals(id3)).toBe(true);
    });

    it('should handle special characters in equality', () => {
      const specialId = 'prod-_-~-!@#$%';
      const id1 = new ProductId(specialId);
      const id2 = new ProductId(specialId);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not affect internal value when comparing', () => {
      const id1 = new ProductId('prod-123');
      const id2 = new ProductId('prod-123');
      id1.equals(id2);
      id1.equals(id2);
      expect(id1.getValue()).toBe('prod-123');
    });
  });

  describe('value object semantics', () => {
    it('should be immutable', () => {
      const id = new ProductId('original-prod');
      const originalValue = id.getValue();
      expect(id.getValue()).toBe(originalValue);
    });

    it('should support value equality semantics', () => {
      const id1 = new ProductId('prod-id');
      const id2 = new ProductId('prod-id');
      // Different instances but same value should be considered equal
      expect(id1 === id2).toBe(false);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should work correctly in collections by value', () => {
      const id1 = new ProductId('prod-123');
      const id2 = new ProductId('prod-123');
      const id3 = new ProductId('prod-456');

      const ids = [id1, id2, id3];
      const hasSameValue = ids.some((i) => i.equals(id1));
      expect(hasSameValue).toBe(true);
    });

    it('should handle multiple instances independently', () => {
      const id1 = new ProductId('prod-one');
      const id2 = new ProductId('prod-two');
      const id3 = new ProductId('prod-one');

      expect(id1.getValue()).toBe('prod-one');
      expect(id2.getValue()).toBe('prod-two');
      expect(id3.getValue()).toBe('prod-one');
      expect(id1.equals(id3)).toBe(true);
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long product ids', () => {
      const longId = 'prod-'.repeat(1000);
      const id = new ProductId(longId);
      expect(id.getValue()).toBe(longId);
    });

    it('should handle strings with whitespace', () => {
      const id = new ProductId('product id with spaces');
      expect(id.getValue()).toBe('product id with spaces');
    });

    it('should handle strings with newlines and tabs', () => {
      const id = new ProductId('prod\nwith\ttabs');
      expect(id.getValue()).toBe('prod\nwith\ttabs');
    });

    it('should handle emoji and unicode characters', () => {
      const id = new ProductId('prod-id-🚀-✅');
      expect(id.getValue()).toBe('prod-id-🚀-✅');
    });

    it('should handle single character id', () => {
      const id = new ProductId('P');
      expect(id.getValue()).toBe('P');
    });

    it('should distinguish between ids with and without leading spaces', () => {
      const id1 = new ProductId(' prod');
      const id2 = new ProductId('prod');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should work with e-commerce SKU formats', () => {
      const id1 = new ProductId('SKU-2024-001-VARIANT-A');
      const id2 = new ProductId('SKU-2024-001-VARIANT-A');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should work with EAN/UPC formats', () => {
      const id = new ProductId('5901234123457');
      expect(id.getValue()).toBe('5901234123457');
    });
  });

  describe('product id usage patterns', () => {
    it('should enable product lookup by id', () => {
      const productMap = new Map<string, string>();
      const productId = new ProductId('prod-123');
      const key = productId.getValue();

      productMap.set(key, 'Product Name');
      expect(productMap.get(key)).toBe('Product Name');
    });

    it('should support filtering products by id', () => {
      const productIds = [
        new ProductId('prod-1'),
        new ProductId('prod-2'),
        new ProductId('prod-3'),
      ];

      const targetId = new ProductId('prod-2');
      const found = productIds.find((id) => id.equals(targetId));

      expect(found).toBeDefined();
      expect(found?.getValue()).toBe('prod-2');
    });

    it('should work as object property key', () => {
      const inventory: Record<string, number> = {};
      const productId = new ProductId('prod-stock');
      inventory[productId.getValue()] = 100;

      expect(inventory['prod-stock']).toBe(100);
    });
  });
});
