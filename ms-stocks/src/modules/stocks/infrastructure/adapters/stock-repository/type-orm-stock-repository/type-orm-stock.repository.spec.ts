import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  STOCK_CACHE_REPOSITORY,
  StockCacheRepositoryPort,
} from '../../../../application/ports/stock.cache-repository.port';
import { Stock } from '../../../../domain/entities/stock.entity';
import { AvailableStock } from '../../../../domain/value-objects/available-stock.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';
import { StockDbEntity } from './db-entities/stock.db-entity';
import { TypeOrmStockRepository } from './type-orm-stock.repository';

describe('TypeOrmStockRepository', () => {
  let repository: TypeOrmStockRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<StockDbEntity>>;
  let mockCacheRepository: jest.Mocked<StockCacheRepositoryPort>;

  beforeEach(async () => {
    mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockCacheRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmStockRepository,
        {
          provide: getRepositoryToken(StockDbEntity),
          useValue: mockTypeOrmRepository,
        },
        {
          provide: STOCK_CACHE_REPOSITORY,
          useValue: mockCacheRepository,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmStockRepository>(TypeOrmStockRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return stock from cache if available', async () => {
      const productId = new ProductId('prod-123');
      const cachedStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Cached Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(cachedStock);

      const result = await repository.findById(productId);

      expect(mockCacheRepository.findById).toHaveBeenCalledWith('prod-123');
      expect(result).toBeDefined();
      expect(result?.getName()).toBe('Cached Product');
      expect(mockTypeOrmRepository.findOne).not.toHaveBeenCalled();
    });

    it('should query database if cache miss', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'DB Product',
        stock: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock);
      mockCacheRepository.save.mockResolvedValue(dbStock);

      const result = await repository.findById(productId);

      expect(mockCacheRepository.findById).toHaveBeenCalledWith('prod-123');
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { productId: 'prod-123' },
      });
      expect(mockCacheRepository.save).toHaveBeenCalledWith(dbStock);
      expect(result).toBeDefined();
    });

    it('should return null when stock not found', async () => {
      const productId = new ProductId('prod-not-exist');

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(productId);

      expect(result).toBeNull();
      expect(mockCacheRepository.save).not.toHaveBeenCalled();
    });

    it('should include movements when flag is true', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [{ quantity: 50, type: 'IN', date: new Date() }],
      };

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock);
      mockCacheRepository.save.mockResolvedValue(dbStock);

      const result = await repository.findById(productId, true);

      expect(result?.getMovements().length).toBe(1);
    });

    it('should exclude movements when flag is false', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [{ quantity: 50, type: 'IN', date: new Date() }],
      };

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock);
      mockCacheRepository.save.mockResolvedValue(dbStock);

      const result = await repository.findById(productId, false);

      expect(result?.getMovements().length).toBe(0);
    });

    it('should exclude movements when not specified', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [{ quantity: 50, type: 'IN', date: new Date() }],
      };

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock);
      mockCacheRepository.save.mockResolvedValue(dbStock);

      const result = await repository.findById(productId);

      expect(result?.getMovements().length).toBe(0);
    });

    it('should map domain entity correctly', async () => {
      const productId = new ProductId('prod-789');
      const date = new Date();
      const dbStock: StockDbEntity = {
        productId: 'prod-789',
        productName: 'Mapped Product',
        stock: 250,
        createdAt: date,
        updatedAt: date,
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId);

      expect(result?.getId().getValue()).toBe('prod-789');
      expect(result?.getName()).toBe('Mapped Product');
      expect(result?.getStock().getValue()).toBe(250);
    });
  });

  describe('save', () => {
    it('should save stock to database and cache', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );

      const dbEntity = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        createdAt: stock.getCreatedAt(),
        updatedAt: stock.getUpdatedAt(),
        stockMovements: [],
      };

      mockTypeOrmRepository.save.mockResolvedValue(dbEntity as any);
      mockCacheRepository.save.mockResolvedValue(dbEntity);

      const result = await repository.save(stock);

      expect(mockTypeOrmRepository.save).toHaveBeenCalled();
      expect(mockCacheRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-123',
          productName: 'Test Product',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should save stock with movements', async () => {
      const productId = new ProductId('prod-456');
      const stock = Stock.create(
        productId,
        'Product with Movements',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(20), 'OUT');

      const dbEntity = {
        productId: 'prod-456',
        productName: 'Product with Movements',
        stock: 130, // 100 + 50 - 20
        createdAt: stock.getCreatedAt(),
        updatedAt: stock.getUpdatedAt(),
        stockMovements: [
          { quantity: 50, type: 'IN', date: expect.any(Date) },
          { quantity: 20, type: 'OUT', date: expect.any(Date) },
        ],
      };

      mockTypeOrmRepository.save.mockResolvedValue(dbEntity as any);
      mockCacheRepository.save.mockResolvedValue(dbEntity);

      const result = await repository.save(stock);

      expect(result).toBeDefined();
      expect(mockTypeOrmRepository.save).toHaveBeenCalled();
    });

    it('should handle database save errors', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));

      mockTypeOrmRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(repository.save(stock)).rejects.toThrow('DB Error');
    });

    it('should map stock to database entity correctly', async () => {
      const productId = new ProductId('prod-789');
      const now = new Date();
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(200),
        [],
        now,
        now,
      );

      mockTypeOrmRepository.save.mockResolvedValue({
        productId: 'prod-789',
        productName: 'Test Product',
        stock: 200,
        createdAt: now,
        updatedAt: now,
        stockMovements: [],
      } as any);
      mockCacheRepository.save.mockResolvedValue({
        productId: 'prod-789',
        productName: 'Test Product',
        stock: 200,
        createdAt: now,
        updatedAt: now,
        stockMovements: [],
      });

      await repository.save(stock);

      const savedEntity = (mockTypeOrmRepository.save as jest.Mock).mock
        .calls[0][0];
      expect(savedEntity.productId).toBe('prod-789');
      expect(savedEntity.productName).toBe('Test Product');
      expect(savedEntity.stock).toBe(200);
    });
  });

  describe('remove', () => {
    it('should remove stock from database and cache', async () => {
      const productId = new ProductId('prod-123');

      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1 } as any);
      mockCacheRepository.remove.mockResolvedValue(undefined);

      await repository.remove(productId);

      expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith('prod-123');
      expect(mockCacheRepository.remove).toHaveBeenCalledWith('prod-123');
    });

    it('should handle removal of non-existent stock', async () => {
      const productId = new ProductId('prod-not-exist');

      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 0 } as any);
      mockCacheRepository.remove.mockResolvedValue(undefined);

      await repository.remove(productId);

      expect(mockTypeOrmRepository.delete).toHaveBeenCalled();
      expect(mockCacheRepository.remove).toHaveBeenCalled();
    });

    it('should handle database deletion errors', async () => {
      const productId = new ProductId('prod-123');

      mockTypeOrmRepository.delete.mockRejectedValue(new Error('DB Error'));

      await expect(repository.remove(productId)).rejects.toThrow('DB Error');
    });
  });

  describe('entity mapping', () => {
    it('should map movement types correctly', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [
          { quantity: 50, type: 'IN', date: new Date() },
          { quantity: 20, type: 'OUT', date: new Date() },
        ],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId, true);

      expect(result?.getMovements()[0].getType()).toBe('IN');
      expect(result?.getMovements()[1].getType()).toBe('OUT');
    });

    it('should preserve timestamps during mapping', async () => {
      const productId = new ProductId('prod-123');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-06-15');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt,
        updatedAt,
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId);

      expect(result?.getCreatedAt()).toEqual(createdAt);
      expect(result?.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should handle complex movement data', async () => {
      const productId = new ProductId('prod-123');
      const movementDate = new Date('2024-06-10T10:30:00Z');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Complex Product',
        stock: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [
          { quantity: 200, type: 'IN', date: movementDate },
          { quantity: 100, type: 'OUT', date: new Date('2024-06-11') },
          { quantity: 150, type: 'IN', date: new Date('2024-06-12') },
        ],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId, true);

      expect(result?.getMovements()).toHaveLength(3);
      expect(result?.getMovements()[0].getQuantity().getValue()).toBe(200);
    });
  });

  describe('cache integration', () => {
    it('should cache results after database retrieval', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(null);
      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock);
      mockCacheRepository.save.mockResolvedValue(dbStock);

      await repository.findById(productId);

      expect(mockCacheRepository.save).toHaveBeenCalledWith(dbStock);
    });

    it('should clear cache on removal', async () => {
      const productId = new ProductId('prod-123');

      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1 } as any);
      mockCacheRepository.remove.mockResolvedValue(undefined);

      await repository.remove(productId);

      expect(mockCacheRepository.remove).toHaveBeenCalledWith('prod-123');
    });

    it('should update cache on save', async () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const dbEntity = {
        productId: 'prod-123',
        productName: 'Test',
        stock: 100,
        createdAt: stock.getCreatedAt(),
        updatedAt: stock.getUpdatedAt(),
        stockMovements: [],
      };

      mockTypeOrmRepository.save.mockResolvedValue(dbEntity as any);
      mockCacheRepository.save.mockResolvedValue(dbEntity);

      await repository.save(stock);

      expect(mockCacheRepository.save).toHaveBeenCalledWith(dbEntity);
    });

    it('should handle concurrent cache and database operations', async () => {
      const productId1 = new ProductId('prod-1');
      const productId2 = new ProductId('prod-2');

      const dbStock1: StockDbEntity = {
        productId: 'prod-1',
        productName: 'Product 1',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      const dbStock2: StockDbEntity = {
        productId: 'prod-2',
        productName: 'Product 2',
        stock: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(dbStock2);

      mockTypeOrmRepository.findOne.mockResolvedValue(dbStock1);
      mockCacheRepository.save.mockResolvedValue(dbStock1);

      const results = await Promise.all([
        repository.findById(productId1),
        repository.findById(productId2),
      ]);

      expect(results).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle stock with zero quantity', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Empty Stock',
        stock: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId);

      expect(result?.getStock().getValue()).toBe(0);
    });

    it('should handle empty movements array', async () => {
      const productId = new ProductId('prod-123');
      const dbStock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'No Movements',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheRepository.findById.mockResolvedValue(dbStock);

      const result = await repository.findById(productId, true);

      expect(result?.getMovements()).toEqual([]);
    });
  });
});
