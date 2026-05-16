import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { FindAllProductsUseCase } from '../application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from '../application/use-cases/find-one-product.use-case';
import { RequestProductCreationUseCase } from '../application/use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from '../application/use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from '../application/use-cases/request-product-update.use-case';
import { DuplicatedProductError } from '../domain/errors/duplicated-product.error';
import { ProductNotChangedError } from '../domain/errors/product-not-changed.error';
import { ProductNotFoundError } from '../domain/errors/product-not-found.error';
import { ProductId } from '../domain/value-objects/product-id.vo';
import { UpdateProductRequestDto } from './dtos/update-product.request.dto';
import { ProductsHttpController } from './products.http.controller';

describe('ProductsHttpController', () => {
  let controller: ProductsHttpController;
  let requestProductCreationUseCase: RequestProductCreationUseCase;
  let requestProductUpdateUseCase: RequestProductUpdateUseCase;
  let requestProductDeletionUseCase: RequestProductDeletionUseCase;
  let findAllProductsUseCase: FindAllProductsUseCase;
  let findOneProductUseCase: FindOneProductUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsHttpController],
      providers: [
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: RequestProductCreationUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: RequestProductUpdateUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: RequestProductDeletionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindAllProductsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindOneProductUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductsHttpController>(ProductsHttpController);
    requestProductCreationUseCase = module.get<RequestProductCreationUseCase>(
      RequestProductCreationUseCase
    );
    requestProductUpdateUseCase = module.get<RequestProductUpdateUseCase>(
      RequestProductUpdateUseCase
    );
    requestProductDeletionUseCase = module.get<RequestProductDeletionUseCase>(
      RequestProductDeletionUseCase
    );
    findAllProductsUseCase = module.get<FindAllProductsUseCase>(FindAllProductsUseCase);
    findOneProductUseCase = module.get<FindOneProductUseCase>(FindOneProductUseCase);
  });

  describe('requestCreate', () => {
    it('should create product successfully', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      };

      const productId = new ProductId('product-123');
      jest.spyOn(requestProductCreationUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.requestCreate(dto);

      expect(result.id).toBe('product-123');
      expect(result.message).toBe('Product creation requested successfully');
    });

    it('should throw ConflictException when product already exists', async () => {
      const dto = {
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      };

      jest
        .spyOn(requestProductCreationUseCase, 'execute')
        .mockRejectedValue(new DuplicatedProductError());

      await expect(controller.requestCreate(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRequest', () => {
    it('should update product successfully', async () => {
      const id = 'product-123';
      const dto = {
        name: 'Updated Product',
        description: 'Updated description',
        price: 150,
        categories: ['Books'],
      };

      const productId = new ProductId(id);
      jest.spyOn(requestProductUpdateUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.updateRequest(id, dto);

      expect(result.id).toBe(id);
      expect(result.message).toBe('Product update requested successfully');
    });

    it('should throw BadRequestException when product not changed', async () => {
      const id = 'product-123';
      const dto = { name: 'Same Name' } as UpdateProductRequestDto;

      jest
        .spyOn(requestProductUpdateUseCase, 'execute')
        .mockRejectedValue(new ProductNotChangedError('No changes'));

      await expect(controller.updateRequest(id, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = 'non-existent-id';
      const dto = { name: 'Updated Name' } as UpdateProductRequestDto;

      jest
        .spyOn(requestProductUpdateUseCase, 'execute')
        .mockRejectedValue(new ProductNotFoundError('Not found'));

      await expect(controller.updateRequest(id, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRequest', () => {
    it('should delete product successfully', async () => {
      const id = 'product-123';
      const productId = new ProductId(id);

      jest.spyOn(requestProductDeletionUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.removeRequest(id);

      expect(result.id).toBe(id);
      expect(result.message).toBe('Product deletion requested successfully');
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = 'non-existent-id';

      jest
        .spyOn(requestProductDeletionUseCase, 'execute')
        .mockRejectedValue(new ProductNotFoundError('Not found'));

      await expect(controller.removeRequest(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllRequest', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 100,
          categories: ['Electronics'],
          sku: 'SKU-1',
          currency: 'DOP',
        },
      ];

      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      const result = await controller.findAllRequest();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product 1');
    });

    it('should filter by category', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 100,
          categories: ['Electronics'],
          sku: 'SKU-1',
          currency: 'DOP',
        },
      ];

      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      const result = await controller.findAllRequest(undefined, 'Electronics');

      expect(findAllProductsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.any(Object),
        })
      );
    });

    it('should convert currency', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 500,
          categories: ['Electronics'],
          sku: 'SKU-1',
          currency: 'USD',
        },
      ];

      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      const result = await controller.findAllRequest('USD');

      expect(findAllProductsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: expect.any(Object),
        })
      );
    });
  });

  describe('findOneRequest', () => {
    it('should return product by ID', async () => {
      const id = 'product-123';
      const mockProduct = {
        id,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
        currency: 'DOP',
      };

      jest.spyOn(findOneProductUseCase, 'execute').mockResolvedValue(mockProduct as any);

      const result = await controller.findOneRequest(id);

      expect(result.id).toBe(id);
      expect(result.name).toBe('Test Product');
    });

    it('should throw NotFoundException when product not found', async () => {
      const id = 'non-existent-id';

      jest
        .spyOn(findOneProductUseCase, 'execute')
        .mockRejectedValue(new ProductNotFoundError('Not found'));

      await expect(controller.findOneRequest(id)).rejects.toThrow(NotFoundException);
    });

    it('should rethrow unknown error from use case', async () => {
      const id = 'product-123';
      const unknownError = new Error('Database connection failed');

      jest.spyOn(findOneProductUseCase, 'execute').mockRejectedValue(unknownError);

      await expect(controller.findOneRequest(id)).rejects.toThrow('Database connection failed');
    });

    it('should include price history when requested', async () => {
      const id = 'product-123';
      const mockProduct = {
        id,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
        currency: 'DOP',
        priceHistory: [{ price: 50, date: new Date() }],
      };

      jest.spyOn(findOneProductUseCase, 'execute').mockResolvedValue(mockProduct as any);

      const result = await controller.findOneRequest(id, true);

      expect(result.priceHistory).toBeDefined();
    });

    it('should convert currency when specified', async () => {
      const id = 'product-123';
      const mockProduct = {
        id,
        name: 'Test Product',
        description: 'A test product',
        price: 50,
        categories: ['Electronics'],
        sku: 'SKU-123',
        currency: 'USD',
      };

      jest.spyOn(findOneProductUseCase, 'execute').mockResolvedValue(mockProduct as any);

      const result = await controller.findOneRequest(id, false, 'USD');

      expect(findOneProductUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: expect.any(Object),
        })
      );
      expect(result.currency).toBe('USD');
    });

    it('should default priceHistory to false', async () => {
      const id = 'product-123';
      const mockProduct = {
        id,
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
        currency: 'DOP',
      };

      jest.spyOn(findOneProductUseCase, 'execute').mockResolvedValue(mockProduct as any);

      await controller.findOneRequest(id);

      expect(findOneProductUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          includePriceHistory: false,
        })
      );
    });
  });

  describe('requestCreate - Additional Scenarios', () => {
    it('should validate multiple categories', async () => {
      const dto = {
        name: 'Multi Category Product',
        description: 'Has many categories',
        price: 200,
        categories: ['Electronics', 'Computers', 'Laptops'],
        sku: 'SKU-MULTI',
      };

      const productId = new ProductId('product-456');
      jest.spyOn(requestProductCreationUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.requestCreate(dto);

      expect(requestProductCreationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({}),
            expect.objectContaining({}),
            expect.objectContaining({}),
          ]),
        })
      );
      expect(result.id).toBe('product-456');
    });

    it('should handle high price values', async () => {
      const dto = {
        name: 'Expensive Product',
        description: 'Very expensive',
        price: 999999.99,
        categories: ['Luxury'],
        sku: 'SKU-EXPENSIVE',
      };

      const productId = new ProductId('product-789');
      jest.spyOn(requestProductCreationUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.requestCreate(dto);

      expect(requestProductCreationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          price: expect.any(Object),
        })
      );
      expect(result.message).toBe('Product creation requested successfully');
    });

    it('should handle unknown errors by re-throwing', async () => {
      const dto = {
        name: 'Product',
        description: 'Test',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      };

      const unexpectedError = new Error('Database connection failed');
      jest.spyOn(requestProductCreationUseCase, 'execute').mockRejectedValue(unexpectedError);

      await expect(controller.requestCreate(dto)).rejects.toThrow(Error);
    });
  });

  describe('updateRequest - Additional Scenarios', () => {
    it('should update only price', async () => {
      const id = 'product-123';
      const dto = { price: 200 } as UpdateProductRequestDto;

      const productId = new ProductId(id);
      jest.spyOn(requestProductUpdateUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.updateRequest(id, dto);

      expect(requestProductUpdateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          price: expect.any(Object),
        })
      );
      expect(result.id).toBe(id);
    });

    it('should handle partial updates', async () => {
      const id = 'product-123';
      const dto = { name: 'New Name' } as UpdateProductRequestDto;

      const productId = new ProductId(id);
      jest.spyOn(requestProductUpdateUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.updateRequest(id, dto);

      expect(requestProductUpdateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          price: undefined,
        })
      );
    });

    it('should handle unknown errors by re-throwing', async () => {
      const id = 'product-123';
      const dto = { name: 'Updated' } as UpdateProductRequestDto;

      const unexpectedError = new Error('Service unavailable');
      jest.spyOn(requestProductUpdateUseCase, 'execute').mockRejectedValue(unexpectedError);

      await expect(controller.updateRequest(id, dto)).rejects.toThrow(Error);
    });

    it('should map multiple categories in update', async () => {
      const id = 'product-123';
      const dto = {
        categories: ['Books', 'Education'],
      } as UpdateProductRequestDto;

      const productId = new ProductId(id);
      jest.spyOn(requestProductUpdateUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.updateRequest(id, dto);

      expect(requestProductUpdateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({}),
            expect.objectContaining({}),
          ]),
        })
      );
      expect(result.message).toBe('Product update requested successfully');
    });
  });

  describe('removeRequest - Additional Scenarios', () => {
    it('should handle unknown errors by re-throwing', async () => {
      const id = 'product-123';

      const unexpectedError = new Error('Transaction failed');
      jest.spyOn(requestProductDeletionUseCase, 'execute').mockRejectedValue(unexpectedError);

      await expect(controller.removeRequest(id)).rejects.toThrow(Error);
    });

    it('should pass ProductId object to use case', async () => {
      const id = 'product-123';
      const productId = new ProductId(id);

      jest.spyOn(requestProductDeletionUseCase, 'execute').mockResolvedValue(productId);

      await controller.removeRequest(id);

      expect(requestProductDeletionUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(ProductId),
        })
      );
    });
  });

  describe('findAllRequest - Additional Scenarios', () => {
    it('should handle empty product list', async () => {
      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue([]);

      const result = await controller.findAllRequest();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple products with different currencies', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Desc 1',
          price: 100,
          categories: ['Electronics'],
          sku: 'SKU-1',
          currency: 'DOP',
        },
        {
          id: 'product-2',
          name: 'Product 2',
          description: 'Desc 2',
          price: 50,
          categories: ['Books'],
          sku: 'SKU-2',
          currency: 'USD',
        },
      ];

      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      const result = await controller.findAllRequest();

      expect(result).toHaveLength(2);
      expect(result[0].currency).toBe('DOP');
      expect(result[1].currency).toBe('USD');
    });

    it('should pass both currency and category filters', async () => {
      const mockProducts = [];
      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      await controller.findAllRequest('USD', 'Electronics');

      expect(findAllProductsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: expect.any(Object),
          category: expect.any(Object),
        })
      );
    });

    it('should map all product fields in response', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Complete Product',
          description: 'Full product data',
          price: 100,
          categories: ['Electronics', 'Gadgets'],
          sku: 'SKU-123',
          currency: 'DOP',
          priceHistory: [{ price: 80, date: new Date() }],
          createdAt: new Date(),
        },
      ];

      jest.spyOn(findAllProductsUseCase, 'execute').mockResolvedValue(mockProducts as any);

      const result = await controller.findAllRequest();

      expect(result[0]).toMatchObject({
        id: 'product-1',
        name: 'Complete Product',
        description: 'Full product data',
        price: 100,
        sku: 'SKU-123',
        currency: 'DOP',
      });
    });
  });

  describe('Response Mapping Validation', () => {
    it('should properly map IdResponseDto structure', async () => {
      const dto = {
        name: 'Test',
        description: 'Desc',
        price: 100,
        categories: ['Cat1'],
        sku: 'SKU',
      };

      const productId = new ProductId('prod-123');
      jest.spyOn(requestProductCreationUseCase, 'execute').mockResolvedValue(productId);

      const result = await controller.requestCreate(dto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message');
      expect(typeof result.id).toBe('string');
      expect(typeof result.message).toBe('string');
    });

    it('should preserve all FindProductResponseDto fields', async () => {
      const id = 'product-123';
      const mockProduct = {
        id,
        name: 'Complete',
        description: 'Full data',
        price: 250.5,
        categories: ['Cat1', 'Cat2'],
        sku: 'FULL-SKU',
        currency: 'USD',
        priceHistory: [],
        createdAt: new Date(),
      };

      jest.spyOn(findOneProductUseCase, 'execute').mockResolvedValue(mockProduct as any);

      const result = await controller.findOneRequest(id);

      expect(result.id).toBe(id);
      expect(result.name).toBe('Complete');
      expect(result.description).toBe('Full data');
      expect(result.price).toBe(250.5);
      expect(result.categories).toEqual(['Cat1', 'Cat2']);
      expect(result.sku).toBe('FULL-SKU');
      expect(result.currency).toBe('USD');
    });
  });
});
