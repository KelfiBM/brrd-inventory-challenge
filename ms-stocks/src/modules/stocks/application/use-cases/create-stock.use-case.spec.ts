import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../domain/entities/stock.entity';
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
import { CreateStockUseCase } from './create-stock.use-case';

describe('CreateStockUseCase', () => {
  let useCase: CreateStockUseCase;
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
        CreateStockUseCase,
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

    useCase = module.get<CreateStockUseCase>(CreateStockUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create a new stock successfully', async () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);
      const newStock = Stock.create(productId, productName);
      mockRepository.save.mockResolvedValue(newStock);

      await useCase.execute({
        correlationId,
        productId,
        productName,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockCreated).toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalled();
    });

    it('should not create stock if it already exists', async () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(productId, productName);

      mockRepository.findById.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        productName,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockCreated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Stock with ID ${productId.getValue()} already exists.`,
      );
    });

    it('should handle null createStockDto', async () => {
      await useCase.execute(null as any);

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockCreated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'CreateStockCommand executed without data',
      );
    });

    it('should emit StockChangedEvent with created stock', async () => {
      const productId = new ProductId('prod-789');
      const productName = 'New Product';
      const correlationId = new CorrelationId('corr-789');

      mockRepository.findById.mockResolvedValue(null);
      const newStock = Stock.create(productId, productName);
      mockRepository.save.mockResolvedValue(newStock);

      await useCase.execute({
        correlationId,
        productId,
        productName,
      });

      expect(mockEventEmitter.emitStockCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: expect.any(CorrelationId),
          }),
          data: expect.any(Stock),
        }),
      );
    });

    it('should handle repository errors', async () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockRejectedValue(new Error('DB Error'));

      await expect(
        useCase.execute({
          correlationId,
          productId,
          productName,
        }),
      ).rejects.toThrow('DB Error');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should log verbose message at execution start', async () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const correlationId = new CorrelationId('corr-456');
      const dto = { correlationId, productId, productName };

      mockRepository.findById.mockResolvedValue(null);
      const newStock = Stock.create(productId, productName);
      mockRepository.save.mockResolvedValue(newStock);

      await useCase.execute(dto);

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Executing CreateStockUseCase with command:',
        dto,
      );
    });

    it('should create stock with empty movements initially', async () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);
      const newStock = Stock.create(productId, productName);
      mockRepository.save.mockResolvedValue(newStock);

      await useCase.execute({
        correlationId,
        productId,
        productName,
      });

      const savedStock = mockRepository.save.mock.calls[0][0];
      expect(savedStock.getMovements()).toEqual([]);
    });

    it('should handle multiple concurrent create requests for different products', async () => {
      const productId1 = new ProductId('prod-1');
      const productId2 = new ProductId('prod-2');
      const correlationId = new CorrelationId('corr-123');

      mockRepository.findById.mockResolvedValue(null);
      const stock1 = Stock.create(productId1, 'Product 1');
      const stock2 = Stock.create(productId2, 'Product 2');
      mockRepository.save
        .mockResolvedValueOnce(stock1)
        .mockResolvedValueOnce(stock2);

      await Promise.all([
        useCase.execute({
          correlationId,
          productId: productId1,
          productName: 'Product 1',
        }),
        useCase.execute({
          correlationId,
          productId: productId2,
          productName: 'Product 2',
        }),
      ]);

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emitStockCreated).toHaveBeenCalledTimes(2);
    });
  });
});
