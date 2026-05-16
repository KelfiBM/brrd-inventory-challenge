import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../domain/entities/stock.entity';
import { AvailableStock } from '../../domain/value-objects/available-stock.vo';
import { CorrelationId } from '../../domain/value-objects/correlation-id.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  STOCK_EVENT_EMITTER,
  StockEventEmitterPort,
} from '../ports/stock.event-emitter.port';
import { STOCK_LOGGER, StockLoggerPort } from '../ports/stock.logger.port';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';
import { DeleteStockUseCase } from './delete-stock.use-case';

describe('DeleteStockUseCase', () => {
  let useCase: DeleteStockUseCase;
  let mockRepository: jest.Mocked<StockRepositoryPort>;
  let mockEventEmitter: jest.Mocked<StockEventEmitterPort>;
  let mockLogger: jest.Mocked<StockLoggerPort>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockEventEmitter = {
      emitCreateStockMovementCommand: jest.fn(),
      emitStockCreated: jest.fn(),
      emitStockUpdated: jest.fn(),
      emitStockDeleted: jest.fn(),
    };

    mockLogger = {
      verbose: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteStockUseCase,
        {
          provide: STOCK_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: STOCK_EVENT_EMITTER,
          useValue: mockEventEmitter,
        },
        {
          provide: STOCK_LOGGER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<DeleteStockUseCase>(DeleteStockUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete existing stock successfully', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.remove.mockResolvedValue(undefined);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.remove).toHaveBeenCalledWith(productId);
      expect(mockEventEmitter.emitStockDeleted).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Stock with ID ${productId.getValue()} deleted successfully.`,
      );
    });

    it('should not delete if stock does not exist', async () => {
      const productId = new ProductId('prod-not-exist');
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockDeleted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Product with ID ${productId.getValue()} does not exist.`,
      );
    });

    it('should handle null deleteProductDto', async () => {
      await useCase.execute(null as any);

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockDeleted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'DeleteProductCommand executed without data',
      );
    });

    it('should emit StockChangedEvent with deleted stock data', async () => {
      const productId = new ProductId('prod-789');
      const correlationId = new CorrelationId('corr-789');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.remove.mockResolvedValue(undefined);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockEventEmitter.emitStockDeleted).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: expect.any(CorrelationId),
          }),
          data: expect.any(Stock),
        }),
      );
    });

    it('should log verbose message at execution start', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const dto = { correlationId, id: productId };
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.remove.mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Executing DeleteProductUseCase with command: {DeleteProductCommand}',
        dto,
      );
    });

    it('should handle repository remove errors', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.remove.mockRejectedValue(new Error('DB Error'));

      await expect(
        useCase.execute({
          correlationId,
          id: productId,
        }),
      ).rejects.toThrow('DB Error');

      expect(mockEventEmitter.emitStockDeleted).not.toHaveBeenCalled();
    });

    it('should delete stock with movements', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      // Add some movements
      existingStock.addMovement(new AvailableStock(50), 'IN');
      existingStock.addMovement(new AvailableStock(20), 'OUT');

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.remove.mockResolvedValue(undefined);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockRepository.remove).toHaveBeenCalledWith(productId);
      expect(mockEventEmitter.emitStockDeleted).toHaveBeenCalled();
    });

    it('should be idempotent - deleting non-existent stock twice', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockDeleted).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should handle deletion of stock with empty movements', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const newStock = Stock.create(productId, 'New Product');

      mockRepository.findById.mockResolvedValue(newStock);
      mockRepository.remove.mockResolvedValue(undefined);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(mockRepository.remove).toHaveBeenCalledWith(productId);
      expect(mockEventEmitter.emitStockDeleted).toHaveBeenCalled();
    });

    it('should handle multiple concurrent deletions for different products', async () => {
      const productId1 = new ProductId('prod-1');
      const productId2 = new ProductId('prod-2');
      const correlationId = new CorrelationId('corr-123');

      const stock1 = Stock.create(productId1, 'Product 1');
      const stock2 = Stock.create(productId2, 'Product 2');

      mockRepository.findById
        .mockResolvedValueOnce(stock1)
        .mockResolvedValueOnce(stock2);
      mockRepository.remove.mockResolvedValue(undefined);

      await Promise.all([
        useCase.execute({
          correlationId,
          id: productId1,
        }),
        useCase.execute({
          correlationId,
          id: productId2,
        }),
      ]);

      expect(mockRepository.remove).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emitStockDeleted).toHaveBeenCalledTimes(2);
    });
  });
});
