import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../domain/entities/stock.entity';
import { StockNotEnoughError } from '../../domain/errors/stock-not-enough.error';
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
import { CreateStockMovementUseCase } from './create-stock-movement.use-case';

describe('CreateStockMovementUseCase', () => {
  let useCase: CreateStockMovementUseCase;
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
        CreateStockMovementUseCase,
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

    useCase = module.get<CreateStockMovementUseCase>(
      CreateStockMovementUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should add IN movement successfully', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 50,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalled();
      expect(mockLogger.verbose).toHaveBeenCalled();
    });

    it('should add OUT movement successfully when stock is sufficient', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'OUT',
        quantity: 30,
      });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalled();
    });

    it('should not create movement if stock does not exist', async () => {
      const productId = new ProductId('prod-not-exist');
      const correlationId = new CorrelationId('corr-456');

      mockRepository.findById.mockResolvedValue(null);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 50,
      });

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Stock with ID ${productId.getValue()} does not exist.`,
      );
    });

    it('should handle null createStockMovementDto', async () => {
      await useCase.execute(null as any);

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'CreateStockMovementCommand executed without data',
      );
    });

    it('should throw error when OUT movement exceeds available stock', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(50),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      await expect(
        useCase.execute({
          correlationId,
          productId,
          movementType: 'OUT',
          quantity: 100,
        }),
      ).rejects.toThrow(StockNotEnoughError);
    });

    it('should emit StockChangedEvent with updated stock', async () => {
      const productId = new ProductId('prod-789');
      const correlationId = new CorrelationId('corr-789');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 50,
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
        movementType: 'IN' as const,
        quantity: 50,
      };
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute(dto);

      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Executing CreateStockMovementUseCase with command:',
        dto,
      );
    });

    it('should add multiple movements sequentially', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(stock);
      mockRepository.save.mockResolvedValue(stock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 50,
      });

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'OUT',
        quantity: 30,
      });

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalledTimes(2);
    });

    it('should handle zero quantity movement', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 0,
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle large quantity movements', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(1000000),
      );

      mockRepository.findById.mockResolvedValue(existingStock);
      mockRepository.save.mockResolvedValue(existingStock);

      await useCase.execute({
        correlationId,
        productId,
        movementType: 'IN',
        quantity: 500000,
      });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitStockUpdated).toHaveBeenCalled();
    });
  });
});
