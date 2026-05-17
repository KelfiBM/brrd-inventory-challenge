import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationId } from '../../domain/value-objects/correlation-id.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { PRODUCT_CONFIG, ProductConfigPort } from '../ports/product.config.port';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { CreateProductUseCase } from './create-product.use-case';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepository: ProductRepositoryPort;
  let productEventEmitter: ProductEventEmitterPort;
  let productConfig: ProductConfigPort;
  let productLogger: ProductLoggerPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            findBySku: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PRODUCT_EVENT_EMITTER,
          useValue: {
            emitProductCreated: jest.fn(),
          },
        },
        {
          provide: PRODUCT_CONFIG,
          useValue: {
            defaultCurrency: jest.fn(() => 'DOP'),
          },
        },
        {
          provide: PRODUCT_LOGGER,
          useValue: {
            verbose: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CreateProductUseCase>(CreateProductUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    productEventEmitter = module.get<ProductEventEmitterPort>(PRODUCT_EVENT_EMITTER);
    productConfig = module.get<ProductConfigPort>(PRODUCT_CONFIG);
    productLogger = module.get<ProductLoggerPort>(PRODUCT_LOGGER);
  });

  describe('execute', () => {
    it('should create and save product when it does not exist', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productRepository.findById).toHaveBeenCalledWith(dto.id);
      expect(productRepository.findBySku).toHaveBeenCalledWith(dto.sku);
      expect(productRepository.save).toHaveBeenCalled();
      expect(productEventEmitter.emitProductCreated).toHaveBeenCalled();
    });

    it('should not save product if it already exists by ID', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const existingProduct = {};
      jest.spyOn(productRepository, 'findById').mockResolvedValue(existingProduct as any);

      await useCase.execute(dto);

      expect(productRepository.save).not.toHaveBeenCalled();
      expect(productEventEmitter.emitProductCreated).not.toHaveBeenCalled();
    });

    it('should not save product if it already exists by SKU', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue({} as any);

      await useCase.execute(dto);

      expect(productRepository.save).not.toHaveBeenCalled();
      expect(productEventEmitter.emitProductCreated).not.toHaveBeenCalled();
    });

    it('should use default currency from config', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productConfig.defaultCurrency).toHaveBeenCalled();
    });

    it('should emit product created event with saved product', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const savedProduct = {
        getId: () => dto.id,
        getName: () => dto.name,
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue(savedProduct as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productEventEmitter.emitProductCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          data: savedProduct,
        })
      );
    });

    it('should handle null DTO gracefully without throwing', async () => {
      await useCase.execute(null as any);

      expect(productRepository.save).not.toHaveBeenCalled();
      expect(productEventEmitter.emitProductCreated).not.toHaveBeenCalled();
      expect(productLogger.warn).toHaveBeenCalledWith('CreateProductCommand executed without data');
    });

    it('should handle multiple categories correctly', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [
          new ProductCategory('Electronics'),
          new ProductCategory('Gadgets'),
          new ProductCategory('Tech'),
        ],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productRepository.save).toHaveBeenCalled();
      expect(productEventEmitter.emitProductCreated).toHaveBeenCalled();
    });

    it('should log verbose message at start of execution', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productLogger.verbose).toHaveBeenCalledWith(
        'Executing CreateProductUseCase with command:',
        expect.any(Object)
      );
    });

    it('should log verbose message on successful product creation', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const savedProduct = { id: 'product-123', name: 'Test Product' };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue(savedProduct as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productLogger.verbose).toHaveBeenCalledWith(
        'Product created successfully:',
        savedProduct
      );
    });

    it('should log warning when product exists by ID', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const existingProduct = { id: 'product-123' };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(existingProduct as any);

      await useCase.execute(dto);

      expect(productLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Product with ID product-123 or SKU SKU-123 already exists.')
      );
    });

    it('should log warning when product exists by SKU', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue({} as any);

      await useCase.execute(dto);

      expect(productLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Product with ID product-123 or SKU SKU-123 already exists.')
      );
    });

    it('should check findBySku only if findById returns null', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      const existingProduct = { id: 'product-123' };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(existingProduct as any);
      const findBySkuSpy = jest.spyOn(productRepository, 'findBySku');

      await useCase.execute(dto);

      expect(findBySkuSpy).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to Product.create', async () => {
      const dto = {
        correlationId: new CorrelationId('corr-123'),
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: dto.id,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          sku: dto.sku,
        })
      );
    });

    it('should pass correlation ID to ProductChangedEvent', async () => {
      const correlationId = new CorrelationId('corr-456');
      const dto = {
        correlationId,
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      };

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);
      jest.spyOn(productRepository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(productRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(productEventEmitter, 'emitProductCreated').mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(productEventEmitter.emitProductCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: expect.objectContaining({
              value: 'corr-456',
            }),
          }),
        })
      );
    });
  });
});
