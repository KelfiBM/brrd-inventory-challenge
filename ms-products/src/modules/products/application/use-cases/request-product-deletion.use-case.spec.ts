import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { RequestProductDeletionUseCase } from './request-product-deletion.use-case';

describe('RequestProductDeletionUseCase', () => {
  let useCase: RequestProductDeletionUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestProductDeletionUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitDeleteProductCommand: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RequestProductDeletionUseCase>(RequestProductDeletionUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
  });

  describe('execute', () => {
    it('should emit delete product command when product exists', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitDeleteProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({ id: productId });

      expect(result).toEqual(productId);
      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productEventEmitter.emitDeleteProductCommand).toHaveBeenCalled();
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await expect(useCase.execute({ id: productId })).rejects.toThrow(ProductNotFoundError);
      expect(productRepository.findById).toHaveBeenCalledWith(productId);
    });

    it('should include correct product ID in delete command', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitDeleteProductCommand').mockResolvedValue(undefined);

      await useCase.execute({ id: productId });

      expect(productEventEmitter.emitDeleteProductCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: productId.getValue(),
          }),
        })
      );
    });

    it('should return the same product ID that was requested for deletion', async () => {
      const productId = new ProductId('product-456');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-456',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitDeleteProductCommand').mockResolvedValue(undefined);

      const result = await useCase.execute({ id: productId });

      expect(result).toEqual(productId);
      expect(result.getValue()).toBe(productId.getValue());
    });

    it('should throw ProductNotFoundError with correct message', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      const error = await useCase.execute({ id: productId }).catch((e) => e);

      expect(error).toBeInstanceOf(ProductNotFoundError);
      expect(error.message).toContain('non-existent-id');
    });
  });
});
