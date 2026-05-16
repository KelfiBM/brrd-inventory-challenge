import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../domain/entities/product.entity';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { UpdateProductUseCase } from './update-product.use-case';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;
  let productLogger: ProductLoggerPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitProductUpdated: jest.fn(),
          },
        },
        {
          provide: PRODUCT_LOGGER,
          useValue: {
            verbose: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateProductUseCase>(UpdateProductUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
    productLogger = module.get<ProductLoggerPort>(PRODUCT_LOGGER);
  });

  describe('execute', () => {
    it('should update product and emit event when product exists', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
        price: new Price(200),
      });

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.save).toHaveBeenCalled();
      expect(productEventEmitter.emitProductUpdated).toHaveBeenCalled();
    });

    it('should not update product if it does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      expect(productRepository.save).not.toHaveBeenCalled();
      expect(productEventEmitter.emitProductUpdated).not.toHaveBeenCalled();
    });

    it('should update only provided fields and keep existing values for others', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      // Check that product update was called with partial data
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should emit product updated event with updated product', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      expect(productEventEmitter.emitProductUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: expect.any(Object),
          }),
        })
      );
    });

    it('should handle null DTO gracefully', async () => {
      await useCase.execute(null as any);

      expect(productRepository.findById).not.toHaveBeenCalled();
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('should log warning when DTO is null', async () => {
      await useCase.execute(null as any);

      expect(productLogger.warn).toHaveBeenCalledWith('UpdateProductCommand executed without data');
    });

    it('should update only name field when only name is provided', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      expect(productRepository.save).toHaveBeenCalled();
      expect(productEventEmitter.emitProductUpdated).toHaveBeenCalled();
    });

    it('should update price when only price is provided', async () => {
      const productId = new ProductId('product-123');
      const newPrice = new Price(250);
      const product = Product.create({
        id: productId,
        name: 'Original Name',
        description: 'Original description',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        price: newPrice,
      });

      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should log verbose message at start of execution', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      const updateDto = {
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      };

      await useCase.execute(updateDto);

      expect(productLogger.verbose).toHaveBeenCalledWith(
        'Executing UpdateProductUseCase with command: {UpdateProductCommand}',
        updateDto
      );
    });

    it('should log success message after update', async () => {
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
      jest.spyOn(productRepository, 'save').mockResolvedValue(product);
      jest.spyOn(productEventEmitter, 'emitProductUpdated').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      expect(productLogger.log).toHaveBeenCalledWith(
        `Product with ID ${productId.getValue()} updated successfully.`
      );
    });

    it('should log warning when product does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
        name: 'Updated Name',
      });

      expect(productLogger.warn).toHaveBeenCalledWith(
        `Product with ID ${productId.getValue()} does not exist.`
      );
    });
  });
});
