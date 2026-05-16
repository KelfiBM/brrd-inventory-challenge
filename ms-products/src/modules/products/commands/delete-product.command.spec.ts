import { DeleteProductCommand } from './delete-product.command';

describe('DeleteProductCommand', () => {
  const validData = {
    id: 'product-123',
  };

  describe('constructor', () => {
    it('should create a valid delete product command', () => {
      const command = new DeleteProductCommand(validData);

      expect(command).toBeDefined();
      expect(command.data).toEqual(validData);
      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when data is null', () => {
      expect(() => new DeleteProductCommand(null as any)).toThrow(
        'Data for DeleteProductCommand is required'
      );
    });

    it('should throw error when data is undefined', () => {
      expect(() => new DeleteProductCommand(undefined as any)).toThrow(
        'Data for DeleteProductCommand is required'
      );
    });

    it('should use provided correlation ID', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const command = new DeleteProductCommand(validData, correlationId);

      expect(command.metadata.correlationId).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', () => {
      const command = new DeleteProductCommand(validData);

      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should use provided timestamp', () => {
      const timestamp = new Date('2024-01-01');
      const command = new DeleteProductCommand(validData, undefined, timestamp);

      expect(command.metadata.timestamp).toEqual(timestamp);
    });
  });

  describe('data', () => {
    it('should store product ID', () => {
      const command = new DeleteProductCommand(validData);

      expect(command.data!.id).toBe(validData.id);
    });
  });
});
