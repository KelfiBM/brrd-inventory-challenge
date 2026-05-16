import { CorrelationId } from './correlation-id.vo';

describe('CorrelationId', () => {
  describe('constructor', () => {
    it('should create instance with valid correlation id', () => {
      const id = new CorrelationId('corr-123');
      expect(id).toBeDefined();
      expect(id.getValue()).toBe('corr-123');
    });

    it('should create instance with UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new CorrelationId(uuid);
      expect(id.getValue()).toBe(uuid);
    });

    it('should create instance with simple string', () => {
      const id = new CorrelationId('simple-id');
      expect(id).toBeDefined();
    });

    it('should create instance with numeric string', () => {
      const id = new CorrelationId('12345');
      expect(id.getValue()).toBe('12345');
    });

    it('should create instance with long string', () => {
      const longId = 'a'.repeat(1000);
      const id = new CorrelationId(longId);
      expect(id.getValue()).toBe(longId);
    });

    it('should create instance with special characters', () => {
      const id = new CorrelationId('corr-_-~-123');
      expect(id.getValue()).toBe('corr-_-~-123');
    });

    it('should throw error for null', () => {
      expect(() => new CorrelationId(null as any)).toThrow(
        'Correlation ID is required',
      );
    });

    it('should throw error for undefined', () => {
      expect(() => new CorrelationId(undefined as any)).toThrow(
        'Correlation ID is required',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => new CorrelationId('')).toThrow('Correlation ID is required');
    });

    it('should accept whitespace strings as valid (non-empty)', () => {
      const id = new CorrelationId('   ');
      expect(id.getValue()).toBe('   ');
    });

    it('should throw error for false value', () => {
      expect(() => new CorrelationId(false as any)).toThrow(
        'Correlation ID is required',
      );
    });

    it('should throw error for zero', () => {
      expect(() => new CorrelationId(0 as any)).toThrow(
        'Correlation ID is required',
      );
    });
  });

  describe('getValue', () => {
    it('should return the correlation id', () => {
      const id = new CorrelationId('test-id-123');
      expect(id.getValue()).toBe('test-id-123');
    });

    it('should return UUID value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new CorrelationId(uuid);
      expect(id.getValue()).toBe(uuid);
    });

    it('should preserve exact string', () => {
      const idString = 'correlation-id-ABC123';
      const id = new CorrelationId(idString);
      expect(id.getValue()).toBe(idString);
    });

    it('should maintain case sensitivity', () => {
      const id = new CorrelationId('CorrelationId-MixedCase');
      expect(id.getValue()).toBe('CorrelationId-MixedCase');
    });

    it('should return immutable value', () => {
      const id = new CorrelationId('immutable-id');
      const firstCall = id.getValue();
      const secondCall = id.getValue();
      expect(firstCall).toBe(secondCall);
    });

    it('should preserve value type as string', () => {
      const id = new CorrelationId('string-id');
      const value = id.getValue();
      expect(typeof value).toBe('string');
    });
  });

  describe('equals', () => {
    it('should return true for same correlation id', () => {
      const id1 = new CorrelationId('corr-123');
      const id2 = new CorrelationId('corr-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different correlation ids', () => {
      const id1 = new CorrelationId('corr-123');
      const id2 = new CorrelationId('corr-456');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return true comparing UUID values', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new CorrelationId(uuid);
      const id2 = new CorrelationId(uuid);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should be case sensitive', () => {
      const id1 = new CorrelationId('ID-ABC');
      const id2 = new CorrelationId('id-abc');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false for similar but different strings', () => {
      const id1 = new CorrelationId('corr-123');
      const id2 = new CorrelationId('corr-1234');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should support chained equality checks', () => {
      const id1 = new CorrelationId('same-id');
      const id2 = new CorrelationId('same-id');
      const id3 = new CorrelationId('same-id');
      expect(id1.equals(id2) && id2.equals(id3)).toBe(true);
    });

    it('should handle special characters in equality', () => {
      const specialId = 'corr-_-~-!@#$%';
      const id1 = new CorrelationId(specialId);
      const id2 = new CorrelationId(specialId);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not affect internal value when comparing', () => {
      const id1 = new CorrelationId('id-123');
      const id2 = new CorrelationId('id-123');
      id1.equals(id2);
      id1.equals(id2);
      expect(id1.getValue()).toBe('id-123');
    });
  });

  describe('value object semantics', () => {
    it('should be immutable', () => {
      const id = new CorrelationId('original-id');
      const originalValue = id.getValue();
      expect(id.getValue()).toBe(originalValue);
    });

    it('should support value equality semantics', () => {
      const id1 = new CorrelationId('corr-id');
      const id2 = new CorrelationId('corr-id');
      // Different instances but same value should be considered equal
      expect(id1 === id2).toBe(false);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should work correctly in collections by value', () => {
      const id1 = new CorrelationId('corr-123');
      const id2 = new CorrelationId('corr-123');
      const id3 = new CorrelationId('corr-456');

      const ids = [id1, id2, id3];
      const hasSameValue = ids.some((i) => i.equals(id1));
      expect(hasSameValue).toBe(true);
    });

    it('should handle multiple instances independently', () => {
      const id1 = new CorrelationId('id-one');
      const id2 = new CorrelationId('id-two');
      const id3 = new CorrelationId('id-one');

      expect(id1.getValue()).toBe('id-one');
      expect(id2.getValue()).toBe('id-two');
      expect(id3.getValue()).toBe('id-one');
      expect(id1.equals(id3)).toBe(true);
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long correlation ids', () => {
      const longId = 'a'.repeat(10000);
      const id = new CorrelationId(longId);
      expect(id.getValue()).toBe(longId);
    });

    it('should handle strings with whitespace', () => {
      const id = new CorrelationId('id with spaces');
      expect(id.getValue()).toBe('id with spaces');
    });

    it('should handle strings with newlines and tabs', () => {
      const id = new CorrelationId('id\nwith\ttabs');
      expect(id.getValue()).toBe('id\nwith\ttabs');
    });

    it('should handle emoji and unicode characters', () => {
      const id = new CorrelationId('corr-id-🚀-✅');
      expect(id.getValue()).toBe('corr-id-🚀-✅');
    });

    it('should handle single character id', () => {
      const id = new CorrelationId('a');
      expect(id.getValue()).toBe('a');
    });

    it('should distinguish between ids with and without leading spaces', () => {
      const id1 = new CorrelationId(' id');
      const id2 = new CorrelationId('id');
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
