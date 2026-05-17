import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { CacheKeys } from '../../../configs/stocks.consts';
import { StockDbEntity } from '../stock-repository/type-orm-stock-repository/db-entities/stock.db-entity';
import { NestStockCacheRepository } from './nest.stock.cache-repository';

describe('NestStockCacheRepository', () => {
  let cacheRepository: NestStockCacheRepository;
  let mockCacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    mockCacheManager = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestStockCacheRepository,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    cacheRepository = module.get<NestStockCacheRepository>(
      NestStockCacheRepository,
    );
  });

  it('should be defined', () => {
    expect(cacheRepository).toBeDefined();
  });

  describe('save', () => {
    it('should save stock to cache', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await cacheRepository.save(stock);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        CacheKeys.STOCK('prod-123'),
        stock,
        0,
      );
      expect(result).toEqual(stock);
    });

    it('should handle stock with movements', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-456',
        productName: 'Product with Movements',
        stock: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [
          { quantity: 50, type: 'IN', date: new Date() },
          { quantity: 20, type: 'OUT', date: new Date() },
        ],
      };

      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await cacheRepository.save(stock);

      expect(result.stockMovements.length).toBe(2);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should handle cache save errors', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.set.mockRejectedValue(new Error('Cache Error'));

      await expect(cacheRepository.save(stock)).rejects.toThrow('Cache Error');
    });

    it('should use correct cache key format', async () => {
      const stock: StockDbEntity = {
        productId: 'special-key',
        productName: 'Test',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.set.mockResolvedValue(undefined);

      await cacheRepository.save(stock);

      const expectedKey = CacheKeys.STOCK('special-key');
      expect(mockCacheManager.set).toHaveBeenCalledWith(expectedKey, stock, 0);
    });
  });

  describe('findById', () => {
    it('should find stock in cache', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.get.mockResolvedValue(stock);

      const result = await cacheRepository.findById('prod-123');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        CacheKeys.STOCK('prod-123'),
      );
      expect(result).toEqual(stock);
    });

    it('should return null when stock not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await cacheRepository.findById('prod-not-exist');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        CacheKeys.STOCK('prod-not-exist'),
      );
      expect(result).toBeNull();
    });

    it('should return null when cache returns undefined', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await cacheRepository.findById('prod-123');

      expect(result).toBeNull();
    });

    it('should handle cache get errors', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache Error'));

      await expect(cacheRepository.findById('prod-123')).rejects.toThrow(
        'Cache Error',
      );
    });

    it('should find stock with movements', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-456',
        productName: 'Product with Movements',
        stock: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [{ quantity: 50, type: 'IN', date: new Date() }],
      };

      mockCacheManager.get.mockResolvedValue(stock);

      const result = await cacheRepository.findById('prod-456');

      expect(result?.stockMovements).toHaveLength(1);
    });

    it('should use correct cache key for retrieval', async () => {
      const productId = 'unique-prod-id';
      mockCacheManager.get.mockResolvedValue(null);

      await cacheRepository.findById(productId);

      const expectedKey = CacheKeys.STOCK(productId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('remove', () => {
    it('should remove stock from cache', async () => {
      mockCacheManager.del.mockResolvedValue(1 as any);

      await cacheRepository.remove('prod-123');

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CacheKeys.STOCK('prod-123'),
      );
    });

    it('should handle cache delete errors', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache Error'));

      await expect(cacheRepository.remove('prod-123')).rejects.toThrow(
        'Cache Error',
      );
    });

    it('should use correct cache key for deletion', async () => {
      const productId = 'special-delete-key';
      mockCacheManager.del.mockResolvedValue(1 as any);

      await cacheRepository.remove(productId);

      const expectedKey = CacheKeys.STOCK(productId);
      expect(mockCacheManager.del).toHaveBeenCalledWith(expectedKey);
    });

    it('should handle non-existent cache entries', async () => {
      mockCacheManager.del.mockResolvedValue(0 as any);

      await cacheRepository.remove('prod-not-exist');

      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should support bulk remove operations', async () => {
      mockCacheManager.del.mockResolvedValue(1 as any as any);

      await Promise.all([
        cacheRepository.remove('prod-1'),
        cacheRepository.remove('prod-2'),
        cacheRepository.remove('prod-3'),
      ]);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    });
  });

  describe('integration scenarios', () => {
    it('should save and retrieve stock from cache', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-123',
        productName: 'Test Product',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(stock);

      await cacheRepository.save(stock);
      const retrieved = await cacheRepository.findById('prod-123');

      expect(retrieved).toEqual(stock);
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('should handle cache lifecycle: save -> find -> remove', async () => {
      const stock: StockDbEntity = {
        productId: 'prod-789',
        productName: 'Lifecycle Test',
        stock: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(stock);
      mockCacheManager.del.mockResolvedValue(1 as any);

      await cacheRepository.save(stock);
      const found = await cacheRepository.findById('prod-789');
      await cacheRepository.remove('prod-789');

      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(found).toEqual(stock);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should handle multiple concurrent save operations', async () => {
      const stocks = [
        {
          productId: 'prod-1',
          productName: 'Product 1',
          stock: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          stockMovements: [],
        },
        {
          productId: 'prod-2',
          productName: 'Product 2',
          stock: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
          stockMovements: [],
        },
      ];

      mockCacheManager.set.mockResolvedValue(undefined);

      await Promise.all(stocks.map((stock) => cacheRepository.save(stock)));

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });
  });
});
