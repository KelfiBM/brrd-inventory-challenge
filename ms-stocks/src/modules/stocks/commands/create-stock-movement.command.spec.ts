import { CreateStockMovementCommand } from './create-stock-movement.command';

describe('CreateStockMovementCommand', () => {
  describe('constructor', () => {
    it('should create instance with valid data', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command).toBeDefined();
      expect(command.data).toEqual(data);
    });

    it('should create instance with all parameters', () => {
      const data = {
        productId: 'prod-456',
        quantity: 30,
        type: 'OUT' as const,
      };
      const correlationId = 'corr-123';
      const timestamp = new Date('2024-06-10');

      const command = new CreateStockMovementCommand(
        data,
        correlationId,
        timestamp,
      );

      expect(command.data).toEqual(data);
      expect(command.metadata.correlationId).toBe(correlationId);
      expect(command.metadata.timestamp).toEqual(timestamp);
    });

    it('should throw error for null data', () => {
      expect(() => new CreateStockMovementCommand(null as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should throw error for undefined data', () => {
      expect(() => new CreateStockMovementCommand(undefined as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should accept IN type', () => {
      const data = {
        productId: 'prod-123',
        quantity: 100,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.type).toBe('IN');
    });

    it('should accept OUT type', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'OUT' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.type).toBe('OUT');
    });

    it('should handle numeric product id', () => {
      const data = {
        productId: '12345',
        quantity: 25,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe('12345');
    });

    it('should handle zero quantity', () => {
      const data = {
        productId: 'prod-123',
        quantity: 0,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.quantity).toBe(0);
    });

    it('should handle large quantity', () => {
      const data = {
        productId: 'prod-123',
        quantity: 999999,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.quantity).toBe(999999);
    });

    it('should handle negative quantity', () => {
      const data = {
        productId: 'prod-123',
        quantity: -100,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.quantity).toBe(-100);
    });

    it('should handle float quantity', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50.5,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.quantity).toBe(50.5);
    });

    it('should handle empty product id', () => {
      const data = {
        productId: '',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe('');
    });

    it('should handle long product id', () => {
      const longId = 'prod-'.repeat(100);
      const data = {
        productId: longId,
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe(longId);
    });
  });

  describe('metadata', () => {
    it('should generate correlation id if not provided', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.metadata.correlationId).toBeDefined();
      expect(typeof command.metadata.correlationId).toBe('string');
      expect(command.metadata.correlationId.length).toBeGreaterThan(0);
    });

    it('should use provided correlation id', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const correlationId = 'custom-corr-id-456';

      const command = new CreateStockMovementCommand(data, correlationId);

      expect(command.metadata.correlationId).toBe(correlationId);
    });

    it('should generate timestamp if not provided', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.metadata.timestamp).toBeDefined();
      expect(command.metadata.timestamp instanceof Date).toBe(true);
    });

    it('should use provided timestamp', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const timestamp = new Date('2024-01-15T10:30:00Z');

      const command = new CreateStockMovementCommand(
        data,
        undefined,
        timestamp,
      );

      expect(command.metadata.timestamp).toEqual(timestamp);
    });

    it('should have metadata accessible', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.metadata).toBeDefined();
      expect(command.metadata.correlationId).toBeDefined();
      expect(command.metadata.timestamp).toBeDefined();
    });
  });

  describe('data access', () => {
    it('should provide access to product id', () => {
      const data = {
        productId: 'prod-789',
        quantity: 100,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe('prod-789');
    });

    it('should provide access to quantity', () => {
      const data = {
        productId: 'prod-123',
        quantity: 75,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.quantity).toBe(75);
    });

    it('should provide access to movement type', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'OUT' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.type).toBe('OUT');
    });

    it('should provide access to all data properties', () => {
      const data = {
        productId: 'prod-321',
        quantity: 200,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data).toEqual({
        productId: 'prod-321',
        quantity: 200,
        type: 'IN',
      });
    });
  });

  describe('command inheritance', () => {
    it('should extend Command base class', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command).toBeInstanceOf(CreateStockMovementCommand);
    });

    it('should have readonly data property', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      // Verify that data is accessible
      expect(command.data).toBeDefined();
    });

    it('should have readonly metadata property', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      // Verify that metadata is accessible
      expect(command.metadata).toBeDefined();
    });
  });

  describe('multiple instances', () => {
    it('should create independent instances', () => {
      const data1 = {
        productId: 'prod-1',
        quantity: 50,
        type: 'IN' as const,
      };
      const data2 = {
        productId: 'prod-2',
        quantity: 100,
        type: 'OUT' as const,
      };

      const command1 = new CreateStockMovementCommand(data1);
      const command2 = new CreateStockMovementCommand(data2);

      expect(command1.data).toEqual(data1);
      expect(command2.data).toEqual(data2);
      expect(command1.metadata.correlationId).not.toBe(
        command2.metadata.correlationId,
      );
    });

    it('should generate different correlation ids for each instance', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command1 = new CreateStockMovementCommand(data);
      const command2 = new CreateStockMovementCommand(data);

      expect(command1.metadata.correlationId).not.toBe(
        command2.metadata.correlationId,
      );
    });

    it('should generate different timestamps for instances created at different times', (done) => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command1 = new CreateStockMovementCommand(data);
      setTimeout(() => {
        const command2 = new CreateStockMovementCommand(data);
        expect(command1.metadata.timestamp.getTime()).toBeLessThanOrEqual(
          command2.metadata.timestamp.getTime(),
        );
        done();
      }, 10);
    });
  });

  describe('edge cases', () => {
    it('should handle data with special characters in product id', () => {
      const data = {
        productId: 'prod-_-~-!@#$%',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe('prod-_-~-!@#$%');
    });

    it('should handle data with unicode in product id', () => {
      const data = {
        productId: 'prod-🚀-✅-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      expect(command.data?.productId).toBe('prod-🚀-✅-123');
    });

    it('should handle correlation id with special format (UUID)', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const uuidCorrelationId = '550e8400-e29b-41d4-a716-446655440000';

      const command = new CreateStockMovementCommand(data, uuidCorrelationId);

      expect(command.metadata.correlationId).toBe(uuidCorrelationId);
    });

    it('should handle command with multiple calls to access data', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      const firstAccess = command.data;
      const secondAccess = command.data;
      const thirdAccess = command.data;

      expect(firstAccess).toEqual(secondAccess);
      expect(secondAccess).toEqual(thirdAccess);
    });

    it('should handle timestamps created at exact same moment', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const timestamp = new Date();

      const command1 = new CreateStockMovementCommand(
        data,
        'corr-1',
        timestamp,
      );
      const command2 = new CreateStockMovementCommand(
        data,
        'corr-2',
        timestamp,
      );

      expect(command1.metadata.timestamp).toEqual(command2.metadata.timestamp);
    });
  });

  describe('command semantics', () => {
    it('should represent a stock movement creation request', () => {
      const data = {
        productId: 'prod-123',
        quantity: 100,
        type: 'IN' as const,
      };

      const command = new CreateStockMovementCommand(data);

      // Verify that the command captures the intent to create a movement
      expect(command.data?.productId).toBe('prod-123');
      expect(command.data?.quantity).toBe(100);
      expect(command.data?.type).toBe('IN');
    });

    it('should track command execution via correlation id', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const executionId = 'exec-12345';

      const command = new CreateStockMovementCommand(data, executionId);

      expect(command.metadata.correlationId).toBe(executionId);
    });

    it('should track command creation time', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };
      const beforeCreation = new Date();

      const command = new CreateStockMovementCommand(data);

      const afterCreation = new Date();

      expect(command.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(command.metadata.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
    });
  });

  describe('validation', () => {
    it('should reject null data with specific error message', () => {
      expect(() => new CreateStockMovementCommand(null as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should reject undefined data with specific error message', () => {
      expect(() => new CreateStockMovementCommand(undefined as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should reject false value for data', () => {
      expect(() => new CreateStockMovementCommand(false as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should reject zero as data', () => {
      expect(() => new CreateStockMovementCommand(0 as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should reject empty string as data', () => {
      expect(() => new CreateStockMovementCommand('' as any)).toThrow(
        'Data for CreateStockMovementCommand is required',
      );
    });

    it('should accept valid data object', () => {
      const data = {
        productId: 'prod-123',
        quantity: 50,
        type: 'IN' as const,
      };

      expect(() => new CreateStockMovementCommand(data)).not.toThrow();
    });
  });
});
