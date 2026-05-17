import { CreateProductCommand } from './create-product.command';

describe('CreateProductCommand', () => {
  const validData = {
    id: 'product-123',
    name: 'Test Product',
    description: 'A test product',
    price: 100,
    categories: ['Electronics'],
    sku: 'SKU-123',
  };

  describe('constructor', () => {
    it('should create a valid create product command', () => {
      const command = new CreateProductCommand(validData);

      expect(command).toBeDefined();
      expect(command.data).toEqual(validData);
      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when data is null', () => {
      expect(() => new CreateProductCommand(null as any)).toThrow(
        'Data for CreateProductCommand is required'
      );
    });

    it('should throw error when data is undefined', () => {
      expect(() => new CreateProductCommand(undefined as any)).toThrow(
        'Data for CreateProductCommand is required'
      );
    });

    it('should use provided correlation ID', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const command = new CreateProductCommand(validData, correlationId);

      expect(command.metadata.correlationId).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', () => {
      const command = new CreateProductCommand(validData);

      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should use provided timestamp', () => {
      const timestamp = new Date('2024-01-01');
      const command = new CreateProductCommand(validData, undefined, timestamp);

      expect(command.metadata.timestamp).toEqual(timestamp);
    });

    it('should set current timestamp if not provided', () => {
      const beforeCreation = new Date();
      const command = new CreateProductCommand(validData);
      const afterCreation = new Date();

      expect(command.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(command.metadata.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('data', () => {
    it('should store all product data', () => {
      const command = new CreateProductCommand(validData);

      expect(command.data!.id).toBe(validData.id);
      expect(command.data!.name).toBe(validData.name);
      expect(command.data!.description).toBe(validData.description);
      expect(command.data!.price).toBe(validData.price);
      expect(command.data!.categories).toEqual(validData.categories);
      expect(command.data!.sku).toBe(validData.sku);
    });
  });
});
