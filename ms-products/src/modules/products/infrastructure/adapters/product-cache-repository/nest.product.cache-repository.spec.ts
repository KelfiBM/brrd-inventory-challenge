import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { CacheKeys } from '../../../configs/products.consts';
import { NestProductCacheRepository } from './nest.product.cache-repository';

describe('NestProductCacheRepository', () => {
  let repository: NestProductCacheRepository;
  let cacheManager: Cache;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestProductCacheRepository,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    repository = module.get<NestProductCacheRepository>(NestProductCacheRepository);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('findAll', () => {
    it('should return cached products', async () => {
      const products = [{ id: '1', name: 'Product 1' }];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(products);

      const result = await repository.findAll();

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(CacheKeys.ALL_PRODUCTS);
    });

    it('should return empty array when cache miss', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('saveAll', () => {
    it('should save products to cache', async () => {
      const products = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 100,
          currency: 'DOP',
          categories: ['Electronics'],
          sku: 'SKU-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          priceHistory: [],
        },
      ];
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.saveAll(products);

      expect(cacheManager.set).toHaveBeenCalledWith(CacheKeys.ALL_PRODUCTS, products, 0);
    });
  });

  describe('findByCategory', () => {
    it('should return cached products by category', async () => {
      const category = 'Electronics';
      const products = [{ id: '1', name: 'Product 1' }];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(products);

      const result = await repository.findByCategory(category);

      expect(result).toEqual(products);
      expect(cacheManager.get).toHaveBeenCalledWith(CacheKeys.PRODUCTS_BY_CATEGORY(category));
    });
  });

  describe('saveByCategory', () => {
    it('should save products by category to cache', async () => {
      const category = 'Electronics';
      const products = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 100,
          currency: 'DOP',
          categories: ['Electronics'],
          sku: 'SKU-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          priceHistory: [],
        },
      ];
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.saveByCategory(category, products);

      expect(cacheManager.set).toHaveBeenCalledWith(
        CacheKeys.PRODUCTS_BY_CATEGORY(category),
        products,
        0
      );
    });
  });

  describe('findById', () => {
    it('should return cached product by ID', async () => {
      const id = 'product-123';
      const product = { id, name: 'Product 1' };
      jest.spyOn(cacheManager, 'get').mockResolvedValue(product);

      const result = await repository.findById(id);

      expect(result).toEqual(product);
      expect(cacheManager.get).toHaveBeenCalledWith(CacheKeys.PRODUCT_BY_ID(id));
    });

    it('should return null when cache miss', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      const result = await repository.findById('product-123');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save product and invalidate related caches', async () => {
      const product = { id: 'product-123', name: 'Product 1', categories: ['Electronics'] };
      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      const result = await repository.save(product as any);

      expect(result).toEqual(product);
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.ALL_PRODUCTS);
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove product and invalidate caches', async () => {
      const id = 'product-123';
      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      await repository.remove(id);

      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.ALL_PRODUCTS);
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCT_BY_ID(id));
    });
  });

  describe('getExchangeRateTable', () => {
    it('should return cached exchange rates', async () => {
      const forCurrency = 'USD';
      const rates = { EUR: 0.85, DOP: 54.5 };
      jest.spyOn(cacheManager, 'get').mockResolvedValue(rates);

      const result = await repository.getExchangeRateTable(forCurrency);

      expect(result).toEqual(rates);
      expect(cacheManager.get).toHaveBeenCalledWith(CacheKeys.EXCHANGE_RATES(forCurrency));
    });

    it('should return empty object when cache miss', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      const result = await repository.getExchangeRateTable('USD');

      expect(result).toEqual({});
    });
  });

  describe('saveExchangeRateTable', () => {
    it('should save exchange rates with 24 hour TTL', async () => {
      const forCurrency = 'USD';
      const rates = { EUR: 0.85, DOP: 54.5 };
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.saveExchangeRateTable(forCurrency, rates);

      expect(cacheManager.set).toHaveBeenCalledWith(
        CacheKeys.EXCHANGE_RATES(forCurrency),
        rates,
        3600 * 1000 * 24
      );
    });

    it('should save with correct TTL value', async () => {
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.saveExchangeRateTable('EUR', { USD: 1.18 });

      const setCalls = (cacheManager.set as jest.Mock).mock.calls;
      const lastCall = setCalls[setCalls.length - 1];

      // 24 hours in milliseconds
      expect(lastCall[2]).toBe(86400000);
    });
  });

  describe('save with category invalidation', () => {
    it('should invalidate category caches when saving product with old categories', async () => {
      const product = {
        id: 'product-123',
        name: 'Updated Product',
        categories: ['Books'],
      };

      const oldProduct = {
        id: 'product-123',
        categories: ['Electronics', 'Gadgets'],
      };

      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(oldProduct);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.save(product as any);

      // Should invalidate old category caches
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCTS_BY_CATEGORY('Electronics'));
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCTS_BY_CATEGORY('Gadgets'));
    });

    it('should always invalidate all products cache', async () => {
      const product = {
        id: 'product-123',
        name: 'Product',
        categories: ['Electronics'],
      };

      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.save(product as any);

      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.ALL_PRODUCTS);
    });
  });

  describe('remove with category invalidation', () => {
    it('should invalidate category caches when removing product', async () => {
      const oldProduct = {
        id: 'product-123',
        categories: ['Electronics', 'Gadgets'],
      };

      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(oldProduct);

      await repository.remove('product-123');

      // Should invalidate category caches
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCTS_BY_CATEGORY('Electronics'));
      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCTS_BY_CATEGORY('Gadgets'));
    });

    it('should invalidate product-specific cache', async () => {
      const id = 'product-456';
      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      await repository.remove(id);

      expect(cacheManager.del).toHaveBeenCalledWith(CacheKeys.PRODUCT_BY_ID(id));
    });
  });

  describe('cache key consistency', () => {
    it('should use consistent cache keys for findById and save', async () => {
      const product = {
        id: 'product-123',
        name: 'Product',
        categories: ['Electronics'],
      };

      jest.spyOn(cacheManager, 'del').mockResolvedValue(true as any);
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await repository.save(product as any);

      // Verify set is called with PRODUCT_BY_ID key
      const setCalls = (cacheManager.set as jest.Mock).mock.calls;
      const productKeyCall = setCalls.find(
        (call: any) => call[0] === CacheKeys.PRODUCT_BY_ID('product-123')
      );

      expect(productKeyCall).toBeDefined();
    });
  });

  describe('findByCategory return values', () => {
    it('should return empty array on cache miss', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      const result = await repository.findByCategory('NonExistent');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
