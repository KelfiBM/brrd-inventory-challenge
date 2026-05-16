import { CorrelationId } from '../value-objects/correlation-id.vo';
import { DomainEvent } from './domain-event';

class TestDomainEvent extends DomainEvent<string> {}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create a domain event with correlation ID and data', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const data = 'test data';

      const event = new TestDomainEvent(correlationId, data);

      expect(event).toBeDefined();
      expect(event.data).toBe(data);
      expect(event.metadata.correlationId).toBeInstanceOf(CorrelationId);
      expect(event.metadata.correlationId.getValue()).toBe(correlationId);
      expect(event.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when data is null', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';

      expect(() => new TestDomainEvent(correlationId, null as any)).toThrow(
        'Domain event data cannot be null or undefined.'
      );
    });

    it('should throw error when data is undefined', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';

      expect(() => new TestDomainEvent(correlationId, undefined as any)).toThrow(
        'Domain event data cannot be null or undefined.'
      );
    });

    it('should use provided timestamp', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const data = 'test data';
      const customTimestamp = new Date('2024-01-01');

      const event = new TestDomainEvent(correlationId, data, customTimestamp);

      expect(event.metadata.timestamp).toEqual(customTimestamp);
    });

    it('should create event with current timestamp when not provided', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const data = 'test data';
      const beforeCreation = new Date();

      const event = new TestDomainEvent(correlationId, data);

      const afterCreation = new Date();

      expect(event.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(event.metadata.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('metadata', () => {
    it('should store correlation ID and timestamp in metadata', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const data = 'test data';

      const event = new TestDomainEvent(correlationId, data);

      expect(event.metadata).toBeDefined();
      expect(event.metadata.correlationId).toBeDefined();
      expect(event.metadata.timestamp).toBeDefined();
    });
  });
});
