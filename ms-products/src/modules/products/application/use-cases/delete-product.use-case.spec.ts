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
import { DeleteProductUseCase } from './delete-product.use-case';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;
  let productLogger: ProductLoggerPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitProductDeleted: jest.fn(),
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

    useCase = module.get<DeleteProductUseCase>(DeleteProductUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
    productLogger = module.get<ProductLoggerPort>(PRODUCT_LOGGER);
  });

  describe('execute', () => {
    it('should delete product and emit event when product exists', async () => {
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
      jest.spyOn(productRepository, 'remove').mockResolvedValue(undefined);
      jest.spyOn(productEventEmitter, 'emitProductDeleted').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
      });

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.remove).toHaveBeenCalledWith(productId);
      expect(productEventEmitter.emitProductDeleted).toHaveBeenCalled();
    });

    it('should not delete product if it does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
      });

      expect(productRepository.remove).not.toHaveBeenCalled();
      expect(productEventEmitter.emitProductDeleted).not.toHaveBeenCalled();
    });

    it('should handle undefined dto gracefully', async () => {
      await useCase.execute(undefined as any);

      expect(productRepository.findById).not.toHaveBeenCalled();
      expect(productRepository.remove).not.toHaveBeenCalled();
    });

    it('should emit product deleted event with existing product', async () => {
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
      jest.spyOn(productRepository, 'remove').mockResolvedValue(undefined);
      jest.spyOn(productEventEmitter, 'emitProductDeleted').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
      });

      expect(productEventEmitter.emitProductDeleted).toHaveBeenCalledWith(
        expect.objectContaining({
          data: product,
        })
      );
    });

    it('should log warning when product does not exist', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
      });

      expect(productLogger.warn).toHaveBeenCalledWith(
        `Product with ID ${productId.getValue()} does not exist.`
      );
    });

    it('should log verbose message at start of execution', async () => {
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
      jest.spyOn(productRepository, 'remove').mockResolvedValue(undefined);
      jest.spyOn(productEventEmitter, 'emitProductDeleted').mockResolvedValue(undefined);

      const deleteDto = {
        correlationId: 'corr-123',
        id: productId,
      };

      await useCase.execute(deleteDto);

      expect(productLogger.verbose).toHaveBeenCalledWith(
        'Executing DeleteProductUseCase with command: {DeleteProductCommand}',
        deleteDto
      );
    });

    it('should log success message after successful deletion', async () => {
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
      jest.spyOn(productRepository, 'remove').mockResolvedValue(undefined);
      jest.spyOn(productEventEmitter, 'emitProductDeleted').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId: 'corr-123',
        id: productId,
      });

      expect(productLogger.log).toHaveBeenCalledWith(
        `Product with ID ${productId.getValue()} deleted successfully.`
      );
    });

    it('should pass correct correlation ID to event', async () => {
      const productId = new ProductId('product-123');
      const correlationId = 'corr-456';
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(productRepository, 'remove').mockResolvedValue(undefined);
      jest.spyOn(productEventEmitter, 'emitProductDeleted').mockResolvedValue(undefined);

      await useCase.execute({
        correlationId,
        id: productId,
      });

      expect(productEventEmitter.emitProductDeleted).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: expect.objectContaining({
              value: correlationId,
            }),
          }),
        })
      );
    });
  });
});
