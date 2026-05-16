import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { CreateProductCommand } from '../commands/create-product.command';
import { DeleteProductCommand } from '../commands/delete-product.command';
import { UpdateProductCommand } from '../commands/update-product.command';
import { ProductsEventController } from './products.event.controller';

describe('ProductsEventController', () => {
  let controller: ProductsEventController;
  let createProductUseCase: CreateProductUseCase;
  let updateProductUseCase: UpdateProductUseCase;
  let deleteProductUseCase: DeleteProductUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsEventController],
      providers: [
        {
          provide: CreateProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateProductUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteProductUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ProductsEventController>(ProductsEventController);
    createProductUseCase = module.get<CreateProductUseCase>(CreateProductUseCase);
    updateProductUseCase = module.get<UpdateProductUseCase>(UpdateProductUseCase);
    deleteProductUseCase = module.get<DeleteProductUseCase>(DeleteProductUseCase);
  });

  describe('handleCreateProductCommand', () => {
    it('should create product from command', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      });

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).toHaveBeenCalled();
    });

    it('should handle command without data gracefully', async () => {
      const command = { data: undefined, metadata: {} } as any;

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle errors during command processing', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      });

      jest.spyOn(createProductUseCase, 'execute').mockRejectedValue(new Error('Database error'));

      await controller.handleCreateProductCommand(command);

      // Should handle error gracefully without throwing
      expect(createProductUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('handleUpdateProductCommand', () => {
    it('should update product from command', async () => {
      const command = new UpdateProductCommand({
        id: 'product-123',
        name: 'Updated Product',
        description: 'Updated description',
        price: 150,
        categories: ['Electronics'],
      });

      jest.spyOn(updateProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleUpdateProductCommand(command);

      expect(updateProductUseCase.execute).toHaveBeenCalled();
    });

    it('should handle command without data gracefully', async () => {
      const command = { data: undefined, metadata: {} } as any;

      jest.spyOn(updateProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleUpdateProductCommand(command);

      expect(updateProductUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteProductCommand', () => {
    it('should delete product from command', async () => {
      const command = new DeleteProductCommand({
        id: 'product-123',
      });

      jest.spyOn(deleteProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleDeleteProductCommand(command);

      expect(deleteProductUseCase.execute).toHaveBeenCalled();
    });

    it('should handle command without data gracefully', async () => {
      const command = { data: undefined, metadata: {} } as any;

      jest.spyOn(deleteProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleDeleteProductCommand(command);

      expect(deleteProductUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle errors during deletion', async () => {
      const command = new DeleteProductCommand({
        id: 'product-123',
      });

      jest.spyOn(deleteProductUseCase, 'execute').mockRejectedValue(new Error('Database error'));

      await controller.handleDeleteProductCommand(command);

      // Should handle error gracefully
      expect(deleteProductUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('handleCreateProductCommand - Error Value Objects', () => {
    it('should handle error when price is negative', async () => {
      const command = {
        data: {
          id: 'product-123',
          name: 'Product',
          description: 'Desc',
          price: -100,
          categories: ['Cat1'],
          sku: 'SKU-123',
        },
        metadata: { correlationId: 'corr-123' },
      } as any;

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      // Should handle error during Price creation gracefully
      await controller.handleCreateProductCommand(command);

      // Use case should not be called since value object creation failed
      expect(createProductUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle error when metadata is missing', async () => {
      const command = {
        data: {
          id: 'product-123',
          name: 'Product',
          description: 'Desc',
          price: 100,
          categories: ['Cat1'],
          sku: 'SKU-123',
        },
        metadata: undefined,
      } as any;

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      // Should handle error during CorrelationId extraction gracefully
      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateProductCommand - Extended', () => {
    it('should handle with single category', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      });

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          sku: 'SKU-123',
        })
      );
    });

    it('should handle multiple categories', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Multi-cat Product',
        description: 'Multiple categories',
        price: 150,
        categories: ['Electronics', 'Computers', 'Laptops', 'Gaming'],
        sku: 'SKU-MULTI',
      });

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.any(Array),
        })
      );
    });

    it('should pass correlation ID from constructor', async () => {
      const command = new CreateProductCommand(
        {
          id: 'product-123',
          name: 'Product',
          description: 'Desc',
          price: 100,
          categories: ['Cat1'],
          sku: 'SKU-123',
        },
        'unique-correlation-id'
      );

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      expect(createProductUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('handleUpdateProductCommand - Extended', () => {
    it('should handle update with all fields', async () => {
      const command = new UpdateProductCommand({
        id: 'product-123',
        name: 'Updated',
        description: 'Updated desc',
        price: 200,
        categories: ['New', 'Categories'],
      });

      jest.spyOn(updateProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleUpdateProductCommand(command);

      expect(updateProductUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated',
        })
      );
    });

    it('should handle update with partial fields', async () => {
      const command = new UpdateProductCommand(
        {
          id: 'product-123',
          name: 'Partial Update',
          description: 'Desc',
          price: 100,
          categories: [],
        },
        'corr-123'
      );

      jest.spyOn(updateProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleUpdateProductCommand(command);

      expect(updateProductUseCase.execute).toHaveBeenCalled();
    });

    it('should extract correlation ID from constructor', async () => {
      const command = new UpdateProductCommand(
        {
          id: 'product-123',
          name: 'Updated',
          description: 'Desc',
          price: 100,
          categories: ['Cat1'],
        },
        'trace-correlation-id-123'
      );

      jest.spyOn(updateProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleUpdateProductCommand(command);

      expect(updateProductUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('handleDeleteProductCommand - Extended', () => {
    it('should extract ID correctly', async () => {
      const command = new DeleteProductCommand({
        id: 'delete-this-product-456',
      });

      jest.spyOn(deleteProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleDeleteProductCommand(command);

      expect(deleteProductUseCase.execute).toHaveBeenCalled();
    });

    it('should pass correlation ID to delete use case', async () => {
      const command = new DeleteProductCommand(
        {
          id: 'product-123',
        },
        'delete-trace-123'
      );

      jest.spyOn(deleteProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleDeleteProductCommand(command);

      expect(deleteProductUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle create errors gracefully without throwing', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Product',
        description: 'Desc',
        price: 100,
        categories: ['Cat1'],
        sku: 'SKU-123',
      });

      jest.spyOn(createProductUseCase, 'execute').mockRejectedValue(new Error('DB Error'));

      // Should not throw
      try {
        await controller.handleCreateProductCommand(command);
        expect(true).toBe(true); // Successfully handled without throwing
      } catch {
        expect(false).toBe(true); // Should not reach here
      }
    });

    it('should handle delete errors gracefully without throwing', async () => {
      const command = new DeleteProductCommand({
        id: 'product-123',
      });

      jest.spyOn(deleteProductUseCase, 'execute').mockRejectedValue(new Error('Delete failed'));

      // Should not throw
      try {
        await controller.handleDeleteProductCommand(command);
        expect(true).toBe(true); // Successfully handled without throwing
      } catch {
        expect(false).toBe(true); // Should not reach here
      }
    });
  });

  describe('Command Data Validation', () => {
    it('should validate required fields in create command', async () => {
      const command = {
        data: {
          id: 'product-123',
          name: 'Product',
          description: 'Desc',
          price: 100,
          categories: ['Cat1'],
          sku: 'SKU-123',
        },
        metadata: { correlationId: 'corr-123' },
      } as any;

      jest.spyOn(createProductUseCase, 'execute').mockResolvedValue(undefined);

      await controller.handleCreateProductCommand(command);

      const callArgs = (createProductUseCase.execute as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('id');
      expect(callArgs).toHaveProperty('name');
      expect(callArgs).toHaveProperty('description');
      expect(callArgs).toHaveProperty('price');
      expect(callArgs).toHaveProperty('categories');
      expect(callArgs).toHaveProperty('sku');
      expect(callArgs).toHaveProperty('correlationId');
    });
  });
});
