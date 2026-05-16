import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../domain/entities/product.entity';
import { ProductNotChangedError } from '../../domain/errors/product-not-changed.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { RequestProductUpdateUseCase } from './request-product-update.use-case';

describe('RequestProductUpdateUseCase', () => {
  let useCase: RequestProductUpdateUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestProductUpdateUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitUpdateProductCommand: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RequestProductUpdateUseCase>(RequestProductUpdateUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
  });

  describe('execute', () => {
    it('should emit update product command with valid changes', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({
        id: productId,
        name: 'Updated Name',
      });

      expect(result).toEqual(productId);
      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalled();
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: productId,
          name: 'New Name',
        })
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw ProductNotChangedError when no fields provided', async () => {
      const productId = new ProductId('product-123');

      await expect(
        useCase.execute({
          id: productId,
        })
      ).rejects.toThrow(ProductNotChangedError);
    });

    it('should throw ProductNotChangedError when new values are same as existing', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      await expect(
        useCase.execute({
          id: productId,
          name: 'Test Product',
          price: new Price(100),
          description: 'Original description',
          categories: [new ProductCategory('Electronics')],
        })
      ).rejects.toThrow(ProductNotChangedError);
    });

    it('should allow updating multiple fields', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({
        id: productId,
        name: 'New Name',
        description: 'New description',
        price: new Price(200),
        categories: [new ProductCategory('Books')],
      });

      expect(result).toEqual(productId);
      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Name',
            description: 'New description',
            price: 200,
            categories: ['Books'],
          }),
        })
      );
    });

    it('should throw ProductNotChangedError when empty categories array provided', async () => {
      const productId = new ProductId('product-123');

      await expect(
        useCase.execute({
          id: productId,
          categories: [],
        })
      ).rejects.toThrow(ProductNotChangedError);
    });

    it('should update description only when provided', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({
        id: productId,
        description: 'New description',
      });

      expect(result).toEqual(productId);
      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalled();
    });

    it('should update price only when provided', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({
        id: productId,
        price: new Price(200),
      });

      expect(result).toEqual(productId);
      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalled();
    });

    it('should update categories only when provided', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      await useCase.execute({
        id: productId,
        categories: [new ProductCategory('Books'), new ProductCategory('Education')],
      });

      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: ['Books', 'Education'],
          }),
        })
      );
    });

    it('should maintain original product ID in emitted command', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitUpdateProductCommand').mockResolvedValue(undefined);

      await useCase.execute({
        id: productId,
        name: 'Updated Name',
      });

      expect(productEventEmitter.emitUpdateProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: productId.getValue(),
          }),
        })
      );
    });
  });
});
