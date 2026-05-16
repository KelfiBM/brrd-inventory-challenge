import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../domain/entities/stock.entity';
import { StockNotFoundError } from '../../domain/errors/stock-not-found.error';
import { AvailableStock } from '../../domain/value-objects/available-stock.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';
import { FindOneStockUseCase } from './find-one-stock.use-case';

describe('FindOneStockUseCase', () => {
  let useCase: FindOneStockUseCase;
  let mockRepository: jest.Mocked<StockRepositoryPort>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneStockUseCase,
        {
          provide: STOCK_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindOneStockUseCase>(FindOneStockUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return stock response when stock exists', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
      });

      expect(result).toBeDefined();
      expect(result.productId).toBe('prod-123');
      expect(result.productName).toBe('Test Product');
      expect(result.stock).toBe(100);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        productId,
        undefined,
      );
    });

    it('should include stock movements in response when flag is true', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(20), 'OUT');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
        includeStockMovements: true,
      });

      expect(result.movementHistory).toBeDefined();
      expect(result.movementHistory?.length).toBe(2);
      expect(result.movementHistory?.[0].type).toBe('IN');
      expect(result.movementHistory?.[0].quantity).toBe(50);
      expect(result.movementHistory?.[1].type).toBe('OUT');
      expect(result.movementHistory?.[1].quantity).toBe(20);
      expect(mockRepository.findById).toHaveBeenCalledWith(productId, true);
    });

    it('should throw StockNotFoundError when stock does not exist', async () => {
      const productId = new ProductId('prod-not-exist');

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: productId,
        }),
      ).rejects.toThrow(StockNotFoundError);

      await expect(
        useCase.execute({
          id: productId,
        }),
      ).rejects.toThrow(`Product with ID ${productId.getValue()} not found`);
    });

    it('should return stock with empty movements when no movements exist', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(productId, 'Test Product');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
        includeStockMovements: true,
      });

      expect(result.movementHistory).toBeDefined();
      expect(result.movementHistory?.length).toBe(0);
    });

    it('should handle stock with custom available stock amount', async () => {
      const productId = new ProductId('prod-456');
      const stock = Stock.create(
        productId,
        'Expensive Product',
        new AvailableStock(5000),
      );

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
      });

      expect(result.stock).toBe(5000);
      expect(result.productName).toBe('Expensive Product');
    });

    it('should return movements with correct metadata', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
        includeStockMovements: true,
      });

      expect(result.movementHistory).toBeDefined();
      expect(result.movementHistory?.[0].date).toBeDefined();
      expect(result.movementHistory?.[0].quantity).toBe(50);
    });

    it('should handle multiple sequential find operations', async () => {
      const productId1 = new ProductId('prod-1');
      const productId2 = new ProductId('prod-2');

      const stock1 = Stock.create(productId1, 'Product 1');
      const stock2 = Stock.create(productId2, 'Product 2');

      mockRepository.findById
        .mockResolvedValueOnce(stock1)
        .mockResolvedValueOnce(stock2);

      const result1 = await useCase.execute({
        id: productId1,
      });

      const result2 = await useCase.execute({
        id: productId2,
      });

      expect(result1.productName).toBe('Product 1');
      expect(result2.productName).toBe('Product 2');
      expect(mockRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle stock with zero available quantity', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Out of Stock',
        new AvailableStock(0),
      );

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
      });

      expect(result.stock).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      const productId = new ProductId('prod-123');

      mockRepository.findById.mockRejectedValue(new Error('DB Error'));

      await expect(
        useCase.execute({
          id: productId,
        }),
      ).rejects.toThrow('DB Error');
    });

    it('should return correct product ID in response', async () => {
      const productId = new ProductId('prod-special-id');
      const stock = Stock.create(productId, 'Special Product');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
      });

      expect(result.productId).toBe('prod-special-id');
    });

    it('should handle stock with mixed IN and OUT movements', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Active Product',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(30), 'OUT');
      stock.addMovement(new AvailableStock(40), 'IN');
      stock.addMovement(new AvailableStock(15), 'OUT');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
        includeStockMovements: true,
      });

      expect(result.movementHistory?.length).toBe(4);
      expect(result.movementHistory?.[0].type).toBe('IN');
      expect(result.movementHistory?.[1].type).toBe('OUT');
      expect(result.movementHistory?.[2].type).toBe('IN');
      expect(result.movementHistory?.[3].type).toBe('OUT');
    });

    it('should not include movements when includeStockMovements is false', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');

      mockRepository.findById.mockResolvedValue(stock);

      const result = await useCase.execute({
        id: productId,
        includeStockMovements: false,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(productId, false);
    });
  });
});
