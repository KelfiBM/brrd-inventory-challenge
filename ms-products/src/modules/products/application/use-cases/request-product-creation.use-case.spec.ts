import { Test, TestingModule } from '@nestjs/testing';
import { DuplicatedProductError } from '../../domain/errors/duplicated-product.error';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { RequestProductCreationUseCase } from './request-product-creation.use-case';

describe('RequestProductCreationUseCase', () => {
  let useCase: RequestProductCreationUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestProductCreationUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findBySku: jest.fn(),
            getNextId: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitCreateProductCommand: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RequestProductCreationUseCase>(RequestProductCreationUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
  });

  describe('execute', () => {
    it('should emit create product command when product does not exist', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const nextId = new ProductId('product-123');

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'getNextId').mockResolvedValue(nextId);
      jest.spyOn(productEventEmitter, 'emitCreateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute(dto);

      expect(result).toEqual(nextId);
      expect(productRepository.findBySku).toHaveBeenCalledWith(dto.sku);
      expect(productRepository.getNextId).toHaveBeenCalled();
      expect(productEventEmitter.emitCreateProductCommand).toHaveBeenCalled();
    });

    it('should throw DuplicatedProductError when product with same SKU exists', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const existingProduct = {
        getId: () => new ProductId('existing-id'),
      };

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(existingProduct as any);

      await expect(useCase.execute(dto)).rejects.toThrow(DuplicatedProductError);
      expect(productRepository.findBySku).toHaveBeenCalledWith(dto.sku);
    });

    it('should include correct data in create product command', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics'), new ProductCategory('Gadgets')],
        sku: 'SKU-123',
      };

      const nextId = new ProductId('product-123');

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'getNextId').mockResolvedValue(nextId);
      jest.spyOn(productEventEmitter, 'emitCreateProductCommand').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productEventEmitter.emitCreateProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: nextId.getValue(),
            name: dto.name,
            description: dto.description,
            price: dto.price.getValue(),
            categories: ['Electronics', 'Gadgets'],
            sku: dto.sku,
          }),
        })
      );
    });

    it('should return next product ID', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const nextId = new ProductId('product-789');

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'getNextId').mockResolvedValue(nextId);
      jest.spyOn(productEventEmitter, 'emitCreateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute(dto);

      expect(result).toEqual(nextId);
      expect(result.getValue()).toBe(nextId.getValue());
    });

    it('should call getNextId when product SKU is unique', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-UNIQUE',
      };

      const nextId = new ProductId('product-123');
      const getNextIdSpy = jest.spyOn(productRepository, 'getNextId').mockResolvedValue(nextId);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productEventEmitter, 'emitCreateProductCommand').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(getNextIdSpy).toHaveBeenCalled();
    });

    it('should throw error without calling getNextId when product exists', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-EXISTING',
      };

      const existingProduct = {
        getId: () => new ProductId('existing-id'),
      };

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(existingProduct as any);
      const getNextIdSpy = jest.spyOn(productRepository, 'getNextId');

      try {
        await useCase.execute(dto);
      } catch (error) {
        // Expected error
      }

      expect(getNextIdSpy).not.toHaveBeenCalled();
    });

    it('should handle single category correctly', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: new Price(50),
        categories: [new ProductCategory('Books')],
        sku: 'SKU-SINGLE',
      };

      const nextId = new ProductId('product-123');

      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'getNextId').mockResolvedValue(nextId);
      jest.spyOn(productEventEmitter, 'emitCreateProductCommand').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productEventEmitter.emitCreateProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: ['Books'],
          }),
        })
      );
    });
  });
});
