import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FindOneStockUseCase } from '../application/use-cases/find-one-stock.use-case';
import { RequestStockMovementCreationUseCase } from '../application/use-cases/request-stock-movement-creation.use-case';
import { StockNotEnoughError } from '../domain/errors/stock-not-enough.error';
import { StockNotFoundError } from '../domain/errors/stock-not-found.error';
import { ProductId } from '../domain/value-objects/product-id.vo';
import { AuthGuard } from './guards/auth.guard';
import { StocksHttpController } from './stocks.http.controller';

describe('StocksHttpController', () => {
  let controller: StocksHttpController;
  let mockRequestStockMovementUseCase: jest.Mocked<RequestStockMovementCreationUseCase>;
  let mockFindOneStockUseCase: jest.Mocked<FindOneStockUseCase>;

  beforeEach(async () => {
    mockRequestStockMovementUseCase = {
      execute: jest.fn(),
    } as any;

    mockFindOneStockUseCase = {
      execute: jest.fn(),
    } as any;

    const mockJwtService = {
      verifyAsync: jest.fn().mockResolvedValue({ sub: 1, username: 'test' }),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksHttpController],
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: RequestStockMovementCreationUseCase,
          useValue: mockRequestStockMovementUseCase,
        },
        {
          provide: FindOneStockUseCase,
          useValue: mockFindOneStockUseCase,
        },
      ],
    }).compile();

    controller = module.get<StocksHttpController>(StocksHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestCreate', () => {
    it('should successfully request stock movement creation', async () => {
      const productId = new ProductId('prod-123');
      const requestDto = {
        amount: 50,
        movementType: 'IN',
      };

      mockRequestStockMovementUseCase.execute.mockResolvedValue(productId);

      const result = await controller.requestCreate('prod-123', requestDto);

      expect(result).toEqual({
        id: 'prod-123',
        message: 'Stock Movement creation requested successfully',
      });
      expect(mockRequestStockMovementUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          movementType: 'IN',
        }),
      );
    });

    it('should handle OUT movement requests', async () => {
      const productId = new ProductId('prod-456');
      const requestDto = {
        amount: 25,
        movementType: 'OUT',
      };

      mockRequestStockMovementUseCase.execute.mockResolvedValue(productId);

      const result = await controller.requestCreate('prod-456', requestDto);

      expect(result.id).toBe('prod-456');
      expect(mockRequestStockMovementUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          movementType: 'OUT',
        }),
      );
    });

    it('should throw NotFoundException when stock not found', async () => {
      const requestDto = {
        amount: 50,
        movementType: 'IN',
      };

      mockRequestStockMovementUseCase.execute.mockRejectedValue(
        new StockNotFoundError('Stock not found', 'prod-not-exist'),
      );

      await expect(
        controller.requestCreate('prod-not-exist', requestDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when insufficient stock', async () => {
      const requestDto = {
        amount: 200,
        movementType: 'OUT',
      };

      mockRequestStockMovementUseCase.execute.mockRejectedValue(
        new StockNotEnoughError('Insufficient stock', 'prod-123'),
      );

      await expect(
        controller.requestCreate('prod-123', requestDto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should rethrow unexpected errors', async () => {
      const requestDto = {
        amount: 50,
        movementType: 'IN',
      };

      mockRequestStockMovementUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.requestCreate('prod-123', requestDto),
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('findOneRequest', () => {
    it('should return stock information', async () => {
      const productId = 'prod-123';
      const stockResponse = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findOneRequest(productId);

      expect(result).toEqual({
        data: {
          productId: 'prod-123',
          productName: 'Test Product',
          stock: 100,
        },
      });
    });

    it('should call find one use case with correct product ID', async () => {
      const productId = 'prod-456';
      const stockResponse = {
        productId: 'prod-456',
        productName: 'Another Product',
        stock: 50,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      await controller.findOneRequest(productId);

      expect(mockFindOneStockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(ProductId),
        }),
      );
    });

    it('should throw NotFoundException when stock not found', async () => {
      mockFindOneStockUseCase.execute.mockRejectedValue(
        new StockNotFoundError('Product not found', 'prod-not-exist'),
      );

      await expect(controller.findOneRequest('prod-not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle stock with zero quantity', async () => {
      const stockResponse = {
        productId: 'prod-empty',
        productName: 'Empty Product',
        stock: 0,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findOneRequest('prod-empty');

      expect(result.data.stock).toBe(0);
    });

    it('should handle stock with large quantity', async () => {
      const stockResponse = {
        productId: 'prod-large',
        productName: 'Large Stock Product',
        stock: 999999,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findOneRequest('prod-large');

      expect(result.data.stock).toBe(999999);
    });

    it('should rethrow unexpected errors', async () => {
      mockFindOneStockUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.findOneRequest('prod-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAllMovementsRequest', () => {
    it('should return stock with movement history', async () => {
      const productId = 'prod-123';
      const stockResponse = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        movementHistory: [
          { quantity: 50, type: 'IN' as const, date: new Date() },
          { quantity: 20, type: 'OUT' as const, date: new Date() },
        ],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findAllMovementsRequest(productId);

      expect(result).toEqual({
        data: {
          productId: 'prod-123',
          movementHistory: stockResponse.movementHistory,
        },
      });
    });

    it('should call find one use case with includeStockMovements flag', async () => {
      const productId = 'prod-456';
      const stockResponse = {
        productId: 'prod-456',
        productName: 'Another Product',
        stock: 75,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      await controller.findAllMovementsRequest(productId);

      expect(mockFindOneStockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(ProductId),
          includeStockMovements: true,
        }),
      );
    });

    it('should return empty movement history when no movements exist', async () => {
      const stockResponse = {
        productId: 'prod-empty',
        productName: 'Empty Product',
        stock: 0,
        movementHistory: [],
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findAllMovementsRequest('prod-empty');

      expect(result.data.movementHistory).toEqual([]);
    });

    it('should handle multiple movements in history', async () => {
      const movements = [
        { quantity: 100, type: 'IN' as const, date: new Date('2024-01-01') },
        { quantity: 50, type: 'OUT' as const, date: new Date('2024-01-05') },
        { quantity: 75, type: 'IN' as const, date: new Date('2024-01-10') },
        { quantity: 25, type: 'OUT' as const, date: new Date('2024-01-15') },
      ];

      const stockResponse = {
        productId: 'prod-history',
        productName: 'Product with History',
        stock: 175,
        movementHistory: movements,
      };

      mockFindOneStockUseCase.execute.mockResolvedValue(stockResponse);

      const result = await controller.findAllMovementsRequest('prod-history');

      expect(result.data.movementHistory).toHaveLength(4);
      expect(result.data.movementHistory).toEqual(movements);
    });

    it('should throw NotFoundException when stock not found', async () => {
      mockFindOneStockUseCase.execute.mockRejectedValue(
        new StockNotFoundError('Product not found', 'prod-not-exist'),
      );

      await expect(
        controller.findAllMovementsRequest('prod-not-exist'),
      ).rejects.toThrow(StockNotFoundError);
    });

    it('should rethrow unexpected errors', async () => {
      mockFindOneStockUseCase.execute.mockRejectedValue(
        new Error('Service unavailable'),
      );

      await expect(
        controller.findAllMovementsRequest('prod-123'),
      ).rejects.toThrow('Service unavailable');
    });
  });

  describe('error handling', () => {
    it('should preserve error message in NotFoundException', async () => {
      const errorMessage = 'Product with ID prod-xyz not found';
      const requestDto = {
        amount: 50,
        movementType: 'IN',
      };

      mockRequestStockMovementUseCase.execute.mockRejectedValue(
        new StockNotFoundError(errorMessage, 'prod-xyz'),
      );

      try {
        await controller.requestCreate('prod-xyz', requestDto);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should preserve error message in UnprocessableEntityException', async () => {
      const errorMessage = 'Cannot remove 200 units, only 100 available';
      const requestDto = {
        amount: 200,
        movementType: 'OUT',
      };

      mockRequestStockMovementUseCase.execute.mockRejectedValue(
        new StockNotEnoughError(errorMessage, 'prod-123'),
      );

      try {
        await controller.requestCreate('prod-123', requestDto);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
      }
    });
  });
});
