import { Command } from './command';

class TestCommand extends Command<{ test: string }> {}

describe('Command', () => {
  describe('constructor', () => {
    it('should create a command with data', () => {
      const data = { test: 'data' };
      const command = new TestCommand('corr-123', undefined, data);

      expect(command.data).toEqual(data);
      expect(command.metadata.correlationId).toBe('corr-123');
      expect(command.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should generate a correlation ID if not provided', () => {
      const command = new TestCommand(undefined, undefined, { test: 'data' });

      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should set timestamp to current time if not provided', () => {
      const beforeCreation = new Date();
      const command = new TestCommand('corr-123', undefined, { test: 'data' });
      const afterCreation = new Date();

      expect(command.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(command.metadata.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should use provided timestamp', () => {
      const customTimestamp = new Date('2024-01-01');
      const command = new TestCommand('corr-123', customTimestamp, { test: 'data' });

      expect(command.metadata.timestamp).toEqual(customTimestamp);
    });

    it('should store data', () => {
      const data = { test: 'value' };
      const command = new TestCommand('corr-123', undefined, data);

      expect(command.data).toEqual(data);
    });

    it('should handle undefined data', () => {
      const command = new TestCommand('corr-123', undefined, undefined);

      expect(command.data).toBeUndefined();
    });
  });

  describe('metadata', () => {
    it('should have correlation ID in metadata', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const command = new TestCommand(correlationId, undefined, { test: 'data' });

      expect(command.metadata.correlationId).toBe(correlationId);
    });

    it('should have timestamp in metadata', () => {
      const timestamp = new Date('2024-01-01');
      const command = new TestCommand('corr-123', timestamp, { test: 'data' });

      expect(command.metadata.timestamp).toEqual(timestamp);
    });
  });
});
