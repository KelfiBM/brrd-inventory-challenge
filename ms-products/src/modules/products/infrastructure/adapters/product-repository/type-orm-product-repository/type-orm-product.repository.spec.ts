import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../../../../application/ports/product.cache-repository.port';
import { Product } from '../../../../domain/entities/product.entity';
import { ProductCategory } from '../../../../domain/value-objects/product-category.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';
import { ProductDbEntity } from './entities/product.db-entity';
import { TypeOrmProductRepository } from './type-orm-product.repository';

describe('TypeOrmProductRepository', () => {
  let repository: TypeOrmProductRepository;
  let dbRepository: Repository<ProductDbEntity>;
  let cacheRepository: ProductCacheRepositoryPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmProductRepository,
        {
          provide: getRepositoryToken(ProductDbEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PRODUCT_CACHE_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            saveAll: jest.fn(),
            findByCategory: jest.fn(),
            saveByCategory: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<TypeOrmProductRepository>(TypeOrmProductRepository);
    dbRepository = module.get<Repository<ProductDbEntity>>(getRepositoryToken(ProductDbEntity));
    cacheRepository = module.get<ProductCacheRepositoryPort>(PRODUCT_CACHE_REPOSITORY);
  });

  describe('getNextId', () => {
    it('should generate a new product ID', async () => {
      const result = await repository.getNextId();

      expect(result).toBeInstanceOf(ProductId);
      expect(result.getValue()).toBeDefined();
      expect(result.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('findAll', () => {
    it('should return all products from cache if available', async () => {
      const cachedProducts = [
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
      jest.spyOn(cacheRepository, 'findAll').mockResolvedValue(cachedProducts as any);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(dbRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache is empty', async () => {
      const dbProducts = [
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
      jest.spyOn(cacheRepository, 'findAll').mockResolvedValue([]);
      jest.spyOn(dbRepository, 'find').mockResolvedValue(dbProducts as any);
      jest.spyOn(cacheRepository, 'saveAll').mockResolvedValue(undefined);

      const result = await repository.findAll();

      expect(dbRepository.find).toHaveBeenCalled();
      expect(cacheRepository.saveAll).toHaveBeenCalledWith(dbProducts);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category from cache if available', async () => {
      const cachedProducts = [
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
      const category = new ProductCategory('Electronics');

      jest.spyOn(cacheRepository, 'findByCategory').mockResolvedValue(cachedProducts as any);

      const result = await repository.findByCategory(category);

      expect(result).toHaveLength(1);
      expect(dbRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return product from cache if available', async () => {
      const cachedProduct = {
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
      };
      const productId = new ProductId('product-1');

      jest.spyOn(cacheRepository, 'findById').mockResolvedValue(cachedProduct as any);

      const result = await repository.findById(productId);

      expect(result).toBeDefined();
      expect(dbRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null when product not found', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(cacheRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(productId);

      expect(result).toBeNull();
    });

    it('should include price history when requested', async () => {
      const productId = new ProductId('product-1');
      const cachedProduct = {
        id: 'product-1',
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        currency: 'DOP',
        categories: ['Electronics'],
        sku: 'SKU-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [{ price: 100, changedAt: new Date() }],
      };

      jest.spyOn(cacheRepository, 'findById').mockResolvedValue(cachedProduct as any);

      const result = await repository.findById(productId, true);

      expect(dbRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database with price history relations when cache misses', async () => {
      const productId = new ProductId('product-1');
      const dbProduct = {
        id: 'product-1',
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        currency: 'DOP',
        categories: ['Electronics'],
        sku: 'SKU-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [{ price: 100, changedAt: new Date() }],
      };

      jest.spyOn(cacheRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(dbProduct as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue(dbProduct as any);

      const result = await repository.findById(productId, true);

      expect(dbRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        select: [
          'id',
          'name',
          'description',
          'price',
          'currency',
          'categories',
          'sku',
          'createdAt',
          'updatedAt',
        ],
        relations: ['priceHistory'],
      });
      expect(result).toBeDefined();
      expect(cacheRepository.save).toHaveBeenCalledWith(dbProduct);
    });

    it('should fetch from database without price history relations when cache misses and includePriceHistory is false', async () => {
      const productId = new ProductId('product-2');
      const dbProduct = {
        id: 'product-2',
        name: 'Product 2',
        description: 'Desc 2',
        price: 200,
        currency: 'DOP',
        categories: ['Electronics'],
        sku: 'SKU-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [],
      };

      jest.spyOn(cacheRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(dbProduct as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue(dbProduct as any);

      const result = await repository.findById(productId, false);

      expect(dbRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-2' },
      });
      expect(result).toBeDefined();
      expect(cacheRepository.save).toHaveBeenCalledWith(dbProduct);
    });
  });

  describe('findBySku', () => {
    it('should return product by SKU', async () => {
      const dbProduct = {
        id: 'product-1',
        sku: 'SKU-123',
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        currency: 'DOP',
        categories: ['Electronics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [],
      };
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(dbProduct as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue(dbProduct as any);

      const result = await repository.findBySku('SKU-123');

      expect(result).toBeDefined();
      expect(dbRepository.findOne).toHaveBeenCalledWith({ where: { sku: 'SKU-123' } });
    });

    it('should return null when product not found', async () => {
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findBySku('non-existent-sku');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save product to database and cache', async () => {
      const product = Product.create({
        id: new ProductId('product-1'),
        name: 'Test Product',
        description: 'Test',
        price: { getValue: () => 100 } as any,
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(dbRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue({} as any);

      await repository.save(product);

      expect(dbRepository.save).toHaveBeenCalled();
      expect(cacheRepository.save).toHaveBeenCalled();
    });

    it('should save to cache after saving to database', async () => {
      const product = Product.create({
        id: new ProductId('product-1'),
        name: 'Product',
        description: 'Test',
        price: { getValue: () => 100 } as any,
        categories: [new ProductCategory('Tech')],
        sku: 'SKU-999',
      });

      jest.spyOn(dbRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue({} as any);

      await repository.save(product);

      // Both should be called
      expect(dbRepository.save).toHaveBeenCalled();
      expect(cacheRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove product from database and cache', async () => {
      const productId = new ProductId('product-1');

      jest.spyOn(dbRepository, 'delete').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(cacheRepository, 'remove').mockResolvedValue(undefined);

      await repository.remove(productId);

      expect(dbRepository.delete).toHaveBeenCalledWith(productId.getValue());
      expect(cacheRepository.remove).toHaveBeenCalledWith(productId.getValue());
    });

    it('should call cache remove even if database operation completes', async () => {
      const productId = new ProductId('product-123');

      jest.spyOn(dbRepository, 'delete').mockResolvedValue({ affected: 1 } as any);
      const cacheRemoveSpy = jest.spyOn(cacheRepository, 'remove').mockResolvedValue(undefined);

      await repository.remove(productId);

      expect(cacheRemoveSpy).toHaveBeenCalledWith(productId.getValue());
    });
  });

  describe('getNextId consistency', () => {
    it('should generate unique IDs on multiple calls', async () => {
      const id1 = await repository.getNextId();
      const id2 = await repository.getNextId();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should return valid UUID format', async () => {
      const id = await repository.getNextId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id.getValue()).toMatch(uuidRegex);
    });
  });

  describe('findAll with database fallback', () => {
    it('should save to cache after database fetch', async () => {
      const dbProducts = [
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
      jest.spyOn(cacheRepository, 'findAll').mockResolvedValue([]);
      jest.spyOn(dbRepository, 'find').mockResolvedValue(dbProducts as any);
      jest.spyOn(cacheRepository, 'saveAll').mockResolvedValue(undefined);

      const result = await repository.findAll();

      expect(cacheRepository.saveAll).toHaveBeenCalledWith(dbProducts);
      expect(result).toBeDefined();
    });

    it('should return cached products when available', async () => {
      const cachedProducts = [
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

      jest.spyOn(cacheRepository, 'findAll').mockResolvedValue(cachedProducts as any);

      const result = await repository.findAll();

      expect(dbRepository.find).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByCategory with database fallback', () => {
    it('should fetch from database if cache is empty', async () => {
      const category = new ProductCategory('Electronics');
      const dbProducts = [
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

      jest.spyOn(cacheRepository, 'findByCategory').mockResolvedValue([]);
      jest.spyOn(dbRepository, 'find').mockResolvedValue(dbProducts as any);
      jest.spyOn(cacheRepository, 'saveByCategory').mockResolvedValue(undefined);

      const result = await repository.findByCategory(category);

      expect(dbRepository.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return cached products when available', async () => {
      const category = new ProductCategory('Electronics');
      const cachedProducts = [
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

      jest.spyOn(cacheRepository, 'findByCategory').mockResolvedValue(cachedProducts as any);

      const result = await repository.findByCategory(category);

      expect(dbRepository.find).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should not cache empty results from database', async () => {
      const category = new ProductCategory('NonExistent');

      jest.spyOn(cacheRepository, 'findByCategory').mockResolvedValue([]);
      jest.spyOn(dbRepository, 'find').mockResolvedValue([]);
      const saveByCategorySpy = jest
        .spyOn(cacheRepository, 'saveByCategory')
        .mockResolvedValue(undefined);

      const result = await repository.findByCategory(category);

      expect(dbRepository.find).toHaveBeenCalled();
      expect(saveByCategorySpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('findBySku', () => {
    it('should return product by SKU', async () => {
      const dbProduct = {
        id: 'product-1',
        sku: 'SKU-123',
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        currency: 'DOP',
        categories: ['Electronics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [],
      };
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(dbProduct as any);
      jest.spyOn(cacheRepository, 'save').mockResolvedValue(dbProduct as any);

      const result = await repository.findBySku('SKU-123');

      expect(result).toBeDefined();
      expect(dbRepository.findOne).toHaveBeenCalledWith({ where: { sku: 'SKU-123' } });
    });

    it('should return null when product not found', async () => {
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findBySku('non-existent-sku');

      expect(result).toBeNull();
    });

    it('should cache product after finding by SKU', async () => {
      const dbProduct = {
        id: 'product-1',
        sku: 'SKU-123',
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        currency: 'DOP',
        categories: ['Electronics'],
        createdAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [],
      };
      jest.spyOn(dbRepository, 'findOne').mockResolvedValue(dbProduct as any);
      const cacheSaveSpy = jest.spyOn(cacheRepository, 'save').mockResolvedValue(dbProduct as any);

      await repository.findBySku('SKU-123');

      expect(cacheSaveSpy).toHaveBeenCalledWith(dbProduct);
    });
  });
});
