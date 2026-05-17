import { CorrelationId } from '../value-objects/correlation-id.vo';
import { DomainEvent } from './domain-event';

// Concrete implementation for testing abstract class
class TestDomainEvent<T = any> extends DomainEvent<T> {}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create event with correlation id, data, and timestamp', () => {
      const correlationId = new CorrelationId('corr-123');
      const data = { message: 'Test event' };
      const timestamp = new Date('2024-06-15');

      const event = new TestDomainEvent(correlationId, data, timestamp);

      expect(event.data).toEqual(data);
      expect(event.metadata.correlationId).toEqual(correlationId);
      expect(event.metadata.timestamp).toEqual(timestamp);
    });

    it('should use provided timestamp', () => {
      const correlationId = new CorrelationId('corr-456');
      const data = { message: 'Event with timestamp' };
      const timestamp = new Date('2025-01-01T12:00:00Z');

      const event = new TestDomainEvent(correlationId, data, timestamp);

      expect(event.metadata.timestamp).toEqual(timestamp);
      expect(event.metadata.timestamp.toISOString()).toBe(
        '2025-01-01T12:00:00.000Z',
      );
    });

    it('should auto-generate timestamp when not provided', () => {
      const correlationId = new CorrelationId('corr-789');
      const data = { message: 'Auto timestamp' };
      const beforeCreate = new Date();

      const event = new TestDomainEvent(correlationId, data);

      const afterCreate = new Date();

      expect(event.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(event.metadata.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should throw error when data is null', () => {
      const correlationId = new CorrelationId('corr-123');

      expect(() => new TestDomainEvent(correlationId, null as any)).toThrow(
        'Domain event data cannot be null or undefined.',
      );
    });

    it('should throw error when data is undefined', () => {
      const correlationId = new CorrelationId('corr-123');

      expect(
        () => new TestDomainEvent(correlationId, undefined as any),
      ).toThrow('Domain event data cannot be null or undefined.');
    });

    it('should accept empty object as valid data', () => {
      const correlationId = new CorrelationId('corr-123');
      const data = {};

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data).toEqual(data);
    });

    it('should accept data with multiple properties', () => {
      const correlationId = new CorrelationId('corr-123');
      const data = {
        message: 'Test',
        quantity: 100,
        type: 'IN',
        active: true,
      };

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data).toEqual(data);
      expect(event.data.message).toBe('Test');
      expect(event.data.quantity).toBe(100);
    });
  });

  describe('metadata', () => {
    it('should have correlation id in metadata', () => {
      const correlationId = new CorrelationId('corr-metadata-test');
      const event = new TestDomainEvent(correlationId, { message: 'Test' });

      expect(event.metadata.correlationId).toBeDefined();
      expect(event.metadata.correlationId.getValue()).toBe(
        'corr-metadata-test',
      );
    });

    it('should have timestamp in metadata', () => {
      const correlationId = new CorrelationId('corr-123');
      const event = new TestDomainEvent(correlationId, { message: 'Test' });

      expect(event.metadata.timestamp).toBeInstanceOf(Date);
      expect(event.metadata.timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should preserve metadata correlation id', () => {
      const correlationId = new CorrelationId('corr-preserved');
      const event = new TestDomainEvent(
        correlationId,
        { message: 'Data 1' },
        new Date('2024-01-01'),
      );

      expect(event.metadata.correlationId.getValue()).toBe('corr-preserved');
    });
  });

  describe('data property', () => {
    it('should store and retrieve data', () => {
      const correlationId = new CorrelationId('corr-123');
      const data = { message: 'Test message', code: 'TEST_001' };

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data.message).toBe('Test message');
      expect(event.data.code).toBe('TEST_001');
    });

    it('should store complex data structures', () => {
      const correlationId = new CorrelationId('corr-complex');
      const data = {
        message: 'Complex',
        nested: {
          level1: {
            level2: 'deep value',
          },
        },
        array: [1, 2, 3],
      };

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data.nested.level1.level2).toBe('deep value');
      expect(event.data.array).toEqual([1, 2, 3]);
    });

    it('should handle data with special values', () => {
      const correlationId = new CorrelationId('corr-special');
      const data: any = {
        message: 'Special',
        zero: 0,
        falseValue: false,
        empty: '',
      };

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data.zero).toBe(0);
      expect(event.data.falseValue).toBe(false);
      expect(event.data.empty).toBe('');
    });
  });

  describe('multiple events', () => {
    it('should create independent event instances', () => {
      const corrId1 = new CorrelationId('corr-1');
      const corrId2 = new CorrelationId('corr-2');
      const event1 = new TestDomainEvent(corrId1, { message: 'Event 1' });
      const event2 = new TestDomainEvent(corrId2, { message: 'Event 2' });

      expect(event1.metadata.correlationId.getValue()).toBe('corr-1');
      expect(event2.metadata.correlationId.getValue()).toBe('corr-2');
    });
  });

  describe('edge cases', () => {
    it('should handle data with circular reference prevention', () => {
      const correlationId = new CorrelationId('corr-circular');
      const data = { message: 'Test' };

      const event = new TestDomainEvent(correlationId, data);

      expect(event.data).toEqual(data);
    });

    it('should handle event data modification after creation', () => {
      const correlationId = new CorrelationId('corr-123');
      const data: any = { message: 'Original', count: 0 };

      const event = new TestDomainEvent(correlationId, data);

      data.message = 'Modified';
      data.count = 5;

      expect(event.data.message).toBe('Modified');
      expect(event.data.count).toBe(5);
    });

    it('should store timestamp with millisecond precision', () => {
      const correlationId = new CorrelationId('corr-precision');
      const timestamp = new Date('2024-06-15T12:30:45.123Z');

      const event = new TestDomainEvent(
        correlationId,
        { test: 'data' } as any,
        timestamp,
      );

      expect(event.metadata.timestamp.getMilliseconds()).toBe(123);
    });

    it('should handle year 2000 timestamp', () => {
      const correlationId = new CorrelationId('corr-y2k');
      const timestamp = new Date('2000-01-01T00:00:00Z');

      const event = new TestDomainEvent(
        correlationId,
        { message: 'Y2K' },
        timestamp,
      );

      expect(event.metadata.timestamp.getUTCFullYear()).toBe(2000);
    });
  });
});
