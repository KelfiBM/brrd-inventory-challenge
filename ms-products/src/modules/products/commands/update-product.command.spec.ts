import { UpdateProductCommand } from './update-product.command';

describe('UpdateProductCommand', () => {
  const validData = {
    id: 'product-123',
    name: 'Updated Product',
    description: 'Updated description',
    price: 150,
    categories: ['Electronics', 'Gadgets'],
  };

  describe('constructor', () => {
    it('should create a valid update product command', () => {
      const command = new UpdateProductCommand(validData);

      expect(command).toBeDefined();
      expect(command.data).toEqual(validData);
      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when data is null', () => {
      expect(() => new UpdateProductCommand(null as any)).toThrow(
        'Data for UpdateProductCommand is required'
      );
    });

    it('should throw error when data is undefined', () => {
      expect(() => new UpdateProductCommand(undefined as any)).toThrow(
        'Data for UpdateProductCommand is required'
      );
    });

    it('should use provided correlation ID', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const command = new UpdateProductCommand(validData, correlationId);

      expect(command.metadata.correlationId).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', () => {
      const command = new UpdateProductCommand(validData);

      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should use provided timestamp', () => {
      const timestamp = new Date('2024-01-01');
      const command = new UpdateProductCommand(validData, undefined, timestamp);

      expect(command.metadata.timestamp).toEqual(timestamp);
    });
  });

  describe('data', () => {
    it('should store all update data', () => {
      const command = new UpdateProductCommand(validData);

      expect(command.data!.id).toBe(validData.id);
      expect(command.data!.name).toBe(validData.name);
      expect(command.data!.description).toBe(validData.description);
      expect(command.data!.price).toBe(validData.price);
      expect(command.data!.categories).toEqual(validData.categories);
    });
  });
});
