import { CorrelationId } from './correlation-id.vo';

describe('CorrelationId', () => {
  describe('constructor', () => {
    it('should create a valid correlation ID', () => {
      const correlationId = new CorrelationId('123e4567-e89b-12d3-a456-426614174000');
      expect(correlationId.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error when correlation ID is empty', () => {
      expect(() => new CorrelationId('')).toThrow('Correlation ID is required');
    });

    it('should throw error when correlation ID is undefined', () => {
      expect(() => new CorrelationId(undefined as any)).toThrow('Correlation ID is required');
    });

    it('should throw error when correlation ID is null', () => {
      expect(() => new CorrelationId(null as any)).toThrow('Correlation ID is required');
    });

    it('should accept any non-empty string as correlation ID', () => {
      const correlationId = new CorrelationId('corr-123');
      expect(correlationId.getValue()).toBe('corr-123');
    });
  });

  describe('equals', () => {
    it('should return true when correlation IDs have the same value', () => {
      const id1 = new CorrelationId('123e4567-e89b-12d3-a456-426614174000');
      const id2 = new CorrelationId('123e4567-e89b-12d3-a456-426614174000');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false when correlation IDs have different values', () => {
      const id1 = new CorrelationId('123e4567-e89b-12d3-a456-426614174000');
      const id2 = new CorrelationId('223e4567-e89b-12d3-a456-426614174000');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the correlation ID value', () => {
      const correlationId = new CorrelationId('test-corr-123');
      expect(correlationId.getValue()).toBe('test-corr-123');
    });
  });
});
