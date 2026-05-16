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
import { UpdateStockUseCase } from './update-stock.use-case';

describe('UpdateStockUseCase', () => {
  let useCase: UpdateStockUseCase;
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
        UpdateStockUseCase,
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

    useCase = module.get<UpdateStockUseCase>(UpdateStockUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update product name successfully', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Product Name',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'New Product Name',
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Stock with Product ID ${productId.getValue()} updated successfully.`,
      );
    });

    it('should not update if stock does not exist', async () => {
      const productId = new ProductId('prod-not-exist');
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'New Name',
      });

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Stock with Product ID ${productId.getValue()} does not exist.`,
      );
    });

    it('should handle null updateStockDto', async () => {
      await useCase.execute(null as any);

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'UpdateStockCommand executed without data',
      );
    });

    it('should emit StockChangedEvent with updated stock', async () => {
      const productId = new ProductId('prod-789');
      const correlationId = new CorrelationId('corr-789');
      const existingStock = Stock.create(
        productId,
        'Original Name',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'Updated Name',
      });

      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalledWith(
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
      const dto = {
        correlationId,
        productId,
        productName: 'New Name',
      };
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute(dto);

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Executing UpdateStockUseCase with command: {UpdateStockCommand}',
        dto,
      );
    });

    it('should use existing product name if new name is not provided', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingName = 'Existing Product Name';
      const existingStock = Stock.create(
        productId,
        existingName,
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: existingName,
      });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalled();
    });

    it('should update stock with movements', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Original Name',
        new AvailableStock(100),
      );
      existingStock.addMovement(new AvailableStock(50), 'IN');
      existingStock.addMovement(new AvailableStock(20), 'OUT');

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'Updated Name',
      });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(existingStock.getMovements().length).toBe(2);
    });

    it('should handle repository save errors', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        useCase.execute({
          correlationId,
          productId,
          productName: 'New Name',
        }),
      ).rejects.toThrow('DB Error');

      expect(mockEventEmitter.emitStockUpdated).not.toHaveBeenCalled();
    });

    it('should update product name to empty string', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: '',
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle special characters in product name', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );
      const specialName = 'Product #123 - Special (Edition) & Premium™';

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: specialName,
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle multiple sequential updates', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      let stock = Stock.create(productId, 'Name 1', new AvailableStock(100));

      mockRepository.findById.mockResolvedValue(stock);
      mockRepository.save.mockImplementation((s) => Promise.resolve(s));

      await useCase.execute({
        correlationId,
        productId,
        productName: 'Name 2',
      });

      await useCase.execute({
        correlationId,
        productId,
        productName: 'Name 3',
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalledTimes(2);
    });

    it('should preserve stock quantity and movements during update', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );
      existingStock.addMovement(new AvailableStock(50), 'IN');

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'New Name',
      });

      const savedStock = mockRepository.save.mock.calls[0][0];
      expect(savedStock.getStock().getValue()).toBe(150); // 100 + 50 from IN movement
      expect(savedStock.getMovements().length).toBe(1);
    });

    it('should update stock updatedAt timestamp', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Old Name',
        new AvailableStock(100),
      );
      const originalUpdatedAt = existingStock.getUpdatedAt?.();

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName: 'New Name',
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
