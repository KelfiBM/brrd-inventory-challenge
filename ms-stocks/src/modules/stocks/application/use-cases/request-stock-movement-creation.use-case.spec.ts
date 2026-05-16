import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../domain/entities/stock.entity';
import { StockNotEnoughError } from '../../domain/errors/stock-not-enough.error';
import { StockNotFoundError } from '../../domain/errors/stock-not-found.error';
import { AvailableStock } from '../../domain/value-objects/available-stock.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  STOCK_EVENT_EMITTER,
  StockEventEmitterPort,
} from '../ports/stock.event-emitter.port';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';
import { RequestStockMovementCreationUseCase } from './request-stock-movement-creation.use-case';

describe('RequestStockMovementCreationUseCase', () => {
  let useCase: RequestStockMovementCreationUseCase;
  let mockRepository: jest.Mocked<StockRepositoryPort>;
  let mockEventEmitter: jest.Mocked<StockEventEmitterPort>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestStockMovementCreationUseCase,
        {
          provide: STOCK_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: STOCK_EVENT_EMITTER,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    useCase = module.get<RequestStockMovementCreationUseCase>(
      RequestStockMovementCreationUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return product ID on successful IN movement request', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'IN',
        amount: 50,
      });

      expect(result).toEqual(productId);
      expect(result.getValue()).toBe('prod-123');
    });

    it('should return product ID on successful OUT movement request', async () => {
      const productId = new ProductId('prod-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(200),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'OUT',
        amount: 50,
      });

      expect(result).toEqual(productId);
    });

    it('should throw StockNotFoundError when stock does not exist', async () => {
      const productId = new ProductId('prod-not-exist');

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          productId,
          movementType: 'IN',
          amount: 50,
        }),
      ).rejects.toThrow(StockNotFoundError);
    });

    it('should throw StockNotFoundError with product ID info', async () => {
      const productId = new ProductId('prod-missing');

      mockRepository.findById.mockResolvedValue(null);

      try {
        await useCase.execute({
          productId,
          movementType: 'IN',
          amount: 50,
        });
        fail('Should have thrown StockNotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(StockNotFoundError);
        expect(error.message).toBe('Stock not found');
        expect(error.productId).toBe('prod-missing');
      }
    });

    it('should throw StockNotEnoughError when OUT movement exceeds available stock', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(50),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      await expect(
        useCase.execute({
          productId,
          movementType: 'OUT',
          amount: 100,
        }),
      ).rejects.toThrow(StockNotEnoughError);
    });
  });

  describe('movement types', () => {
    it('should handle IN movement type correctly', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'IN',
        amount: 75,
      });

      expect(result).toBeDefined();
    });

    it('should handle OUT movement type correctly', async () => {
      const productId = new ProductId('prod-456');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(200),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'OUT',
        amount: 75,
      });

      expect(result).toBeDefined();
    });
  });

  describe('amount validation', () => {
    it('should allow zero amount movement', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'IN',
        amount: 0,
      });

      expect(result).toBeDefined();
    });

    it('should allow large amount movements', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(1000000),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'IN',
        amount: 999999,
      });

      expect(result).toBeDefined();
    });

    it('should allow exact OUT movement matching available stock', async () => {
      const productId = new ProductId('prod-123');
      const existingStock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'OUT',
        amount: 100,
      });

      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle stock with zero initial quantity', async () => {
      const productId = new ProductId('prod-empty');
      const existingStock = Stock.create(
        productId,
        'Empty Product',
        new AvailableStock(0),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      const result = await useCase.execute({
        productId,
        movementType: 'IN',
        amount: 50,
      });

      expect(result).toBeDefined();
    });

    it('should throw error when trying OUT movement on empty stock', async () => {
      const productId = new ProductId('prod-empty');
      const existingStock = Stock.create(
        productId,
        'Empty Product',
        new AvailableStock(0),
      );

      mockRepository.findById.mockResolvedValue(existingStock);

      await expect(
        useCase.execute({
          productId,
          movementType: 'OUT',
          amount: 1,
        }),
      ).rejects.toThrow(StockNotEnoughError);
    });

    it('should handle repository errors', async () => {
      const productId = new ProductId('prod-123');

      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(
        useCase.execute({
          productId,
          movementType: 'IN',
          amount: 50,
        }),
      ).rejects.toThrow('Database error');
    });
  });
});
