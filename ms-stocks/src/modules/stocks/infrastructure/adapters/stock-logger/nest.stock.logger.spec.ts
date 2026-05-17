import { Logger } from '@nestjs/common';
import { NestStockLogger } from './nest.stock.logger';

describe('NestStockLogger', () => {
  let logger: NestStockLogger;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create mock Logger instance
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
    } as any;

    logger = new NestStockLogger();
    // Inject our mock logger directly
    (logger as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  describe('error', () => {
    it('should log error message', () => {
      const message = 'An error occurred';
      logger.error(message);

      expect(mockLogger.error).toHaveBeenCalledWith(message, undefined);
    });

    it('should log error with trace', () => {
      const message = 'Error with trace';
      const trace = 'Stack trace information';
      logger.error(message, trace);

      expect(mockLogger.error).toHaveBeenCalledWith(message, trace);
    });

    it('should log error with metadata', () => {
      const message = 'Error with metadata';
      const trace = 'Stack trace';
      const meta1 = { userId: '123' };
      const meta2 = { action: 'delete' };

      logger.error(message, trace, meta1, meta2);

      expect(mockLogger.error).toHaveBeenCalledWith(
        message,
        trace,
        meta1,
        meta2,
      );
    });

    it('should handle error with complex trace', () => {
      const message = 'Database error';
      const trace = 'Error: Connection timeout';

      logger.error(message, trace);

      expect(mockLogger.error).toHaveBeenCalledWith(message, trace);
    });

    it('should handle error without trace', () => {
      const message = 'Simple error';
      logger.error(message);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const message = 'Warning occurred';

      logger.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message);
    });

    it('should log warning with metadata', () => {
      const message = 'Stock low';
      const meta = { productId: 'prod-123' };

      logger.warn(message, meta);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('should log warning with multiple metadata items', () => {
      const message = 'Multi-meta warning';
      const meta1 = { id: '123' };
      const meta2 = { status: 'pending' };
      const meta3 = { timestamp: new Date() };

      logger.warn(message, meta1, meta2, meta3);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        message,
        meta1,
        meta2,
        meta3,
      );
    });

    it('should handle warning with empty metadata', () => {
      const message = 'Warning without meta';
      logger.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message);
    });
  });

  describe('log', () => {
    it('should log info message', () => {
      const message = 'Information message';
      logger.log(message);

      expect(mockLogger.log).toHaveBeenCalledWith(message);
    });

    it('should log message with metadata', () => {
      const message = 'Stock created';
      const meta = { productId: 'prod-456' };

      logger.log(message, meta);

      expect(mockLogger.log).toHaveBeenCalledWith(message, meta);
    });

    it('should log success messages', () => {
      const message = 'Operation completed successfully';
      logger.log(message);

      expect(mockLogger.log).toHaveBeenCalledWith(message);
    });

    it('should handle log with complex metadata', () => {
      const message = 'Operation log';
      const metadata = {
        operation: 'create',
        resource: 'stock',
        result: { id: 'prod-123', name: 'Test' },
      };

      logger.log(message, metadata);

      expect(mockLogger.log).toHaveBeenCalledWith(message, metadata);
    });

    it('should pass through object metadata', () => {
      const metadata = {
        productId: 'prod-123',
        quantity: 100,
        timestamp: new Date(),
      };

      logger.log('Operation completed', metadata);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Operation completed',
        metadata,
      );
    });

    it('should handle array metadata', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      logger.log('Multiple items processed', items);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Multiple items processed',
        items,
      );
    });

    it('should handle null and undefined metadata', () => {
      logger.warn('Message 1', null);
      logger.warn('Message 2', undefined);
      logger.log('Message 3', null);

      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).toHaveBeenCalledTimes(1);
    });

    it('should preserve metadata structure', () => {
      const metadata = {
        user: { id: '123', role: 'admin' },
        resource: { type: 'stock', id: 'prod-456' },
        action: 'create',
      };

      logger.verbose('Audit log', metadata);

      expect(mockLogger.verbose).toHaveBeenCalledWith('Audit log', metadata);
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      const message = 'Detailed verbose information';
      logger.verbose(message);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message);
    });

    it('should log verbose with metadata', () => {
      const message = 'Verbose execution trace';
      const meta = { step: 1, action: 'initialize' };

      logger.verbose(message, meta);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, meta);
    });

    it('should log verbose with multiple metadata items', () => {
      const message = 'Detailed process flow';
      const meta1 = { stage: 'start' };
      const meta2 = { duration: 100 };

      logger.verbose(message, meta1, meta2);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, meta1, meta2);
    });

    it('should handle verbose debug information', () => {
      const message = 'Debugging information for use case execution';
      const debugInfo = {
        input: { id: 'prod-123' },
        output: { success: true },
      };

      logger.verbose(message, debugInfo);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, debugInfo);
    });
  });

  describe('integration scenarios', () => {
    it('should handle sequential logging at different levels', () => {
      logger.verbose('Starting operation');
      logger.log('Operation in progress');
      logger.warn('Warning during operation');
      logger.error('Error occurred', 'Error details');

      expect(mockLogger.verbose).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent log calls', () => {
      const promises = [
        Promise.resolve(logger.verbose('Verbose 1')),
        Promise.resolve(logger.log('Log 1')),
        Promise.resolve(logger.warn('Warn 1')),
        Promise.resolve(logger.error('Error 1')),
      ];

      Promise.all(promises);

      expect(mockLogger.verbose).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle use case execution logging', () => {
      const useCaseName = 'CreateStockUseCase';
      const productId = 'prod-123';

      logger.verbose(`Executing ${useCaseName}`, { productId });
      logger.log(`${useCaseName} completed successfully`, { productId });

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        `Executing ${useCaseName}`,
        { productId },
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        `${useCaseName} completed successfully`,
        { productId },
      );
    });

    it('should handle stock operation logging', () => {
      logger.verbose('Starting stock operation', {
        operation: 'add_movement',
        type: 'IN',
        quantity: 50,
      });
      logger.log('Stock movement added successfully', {
        newStock: 150,
        movementId: 'mov-123',
      });

      expect(mockLogger.verbose).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should handle error with full context', () => {
      const context = {
        operation: 'update_stock',
        productId: 'prod-123',
        originalError: new Error('Database error'),
      };

      logger.error(
        'Failed to update stock',
        'Error: Database connection failed',
        context,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('logger metadata handling', () => {
    it('should pass through primitive metadata types', () => {
      logger.log('String metadata', 'meta-value');
      logger.log('Number metadata', 42);
      logger.log('Boolean metadata', true);

      expect(mockLogger.log).toHaveBeenCalledTimes(3);
    });

    it('should maintain metadata chain through multiple calls', () => {
      const context = { requestId: 'req-123', userId: 'user-456' };

      logger.verbose('Starting', context);
      logger.log('Processing', context);
      logger.warn('Checking', context);

      expect(mockLogger.verbose).toHaveBeenCalledWith('Starting', context);
      expect(mockLogger.log).toHaveBeenCalledWith('Processing', context);
      expect(mockLogger.warn).toHaveBeenCalledWith('Checking', context);
    });

    it('should handle deeply nested metadata objects', () => {
      const deepMetadata = {
        level1: {
          level2: {
            level3: {
              value: 'deep-value',
              array: [1, 2, 3],
            },
          },
        },
      };

      logger.log('Deep metadata', deepMetadata);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Deep metadata',
        deepMetadata,
      );
    });

    it('should forward all arguments to logger methods', () => {
      logger.log('message1');
      logger.log('message2', 'meta1');
      logger.log('message3', 'meta1', 'meta2');
      logger.log('message4', 'meta1', 'meta2', 'meta3');

      expect(mockLogger.log).toHaveBeenCalledTimes(4);
    });
  });
});
