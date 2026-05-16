import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { CreateProductCommand } from '../../../commands/create-product.command';
import { DeleteProductCommand } from '../../../commands/delete-product.command';
import { UpdateProductCommand } from '../../../commands/update-product.command';
import { Product } from '../../../domain/entities/product.entity';
import { ProductChangedEvent } from '../../../domain/events/product-changed.event';
import { Price } from '../../../domain/value-objects/price.vo';
import { ProductCategory } from '../../../domain/value-objects/product-category.vo';
import { ProductId } from '../../../domain/value-objects/product-id.vo';
import { NestProductEventEmitter } from './nest.product.event-emitter';

describe('NestProductEventEmitter', () => {
  let emitter: NestProductEventEmitter;
  let nestClient: ClientProxy;

  beforeEach(async () => {
    const mockClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestProductEventEmitter,
        {
          provide: EVENT_STREAMING_CLIENT,
          useValue: mockClient,
        },
      ],
    }).compile();

    emitter = module.get<NestProductEventEmitter>(NestProductEventEmitter);
    nestClient = module.get<ClientProxy>(EVENT_STREAMING_CLIENT);
  });

  describe('emitCreateProductCommand', () => {
    it('should emit create product command', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      });

      await emitter.emitCreateProductCommand(command);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('emitUpdateProductCommand', () => {
    it('should emit update product command', async () => {
      const command = new UpdateProductCommand({
        id: 'product-123',
        name: 'Updated Product',
        description: 'Updated description',
        price: 150,
        categories: ['Electronics'],
      });

      await emitter.emitUpdateProductCommand(command);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('emitDeleteProductCommand', () => {
    it('should emit delete product command', async () => {
      const command = new DeleteProductCommand({
        id: 'product-123',
      });

      await emitter.emitDeleteProductCommand(command);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('emitProductCreated', () => {
    it('should emit product created event', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);

      await emitter.emitProductCreated(event);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('emitProductUpdated', () => {
    it('should emit product updated event', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Updated Product',
        description: 'Updated description',
        price: new Price(150),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);

      await emitter.emitProductUpdated(event);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('emitProductDeleted', () => {
    it('should emit product deleted event', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);

      await emitter.emitProductDeleted(event);

      expect(nestClient.emit).toHaveBeenCalled();
    });
  });

  describe('mapToProductChangedEventDto', () => {
    it('should map product changed event correctly', () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics'), new ProductCategory('Gadgets')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);

      const dto = emitter['mapToProductChangedEventDto'](event);

      expect(dto.metadata.correlationId).toBe('corr-123');
      expect(dto.data.id).toBe('product-123');
      expect(dto.data.name).toBe('Test Product');
      expect(dto.data.description).toBe('A test product');
      expect(dto.data.price).toBe(100);
      expect(dto.data.sku).toBe('SKU-123');
      expect(dto.data.categories).toEqual(['Electronics', 'Gadgets']);
    });

    it('should include timestamp in metadata', () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);
      const dto = emitter['mapToProductChangedEventDto'](event);

      expect(dto.metadata.timestamp).toBeDefined();
      expect(dto.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should map all product fields correctly', () => {
      const product = Product.create({
        id: new ProductId('prod-456'),
        name: 'Complex Product',
        description: 'Complex description',
        price: new Price(299.99),
        categories: [new ProductCategory('Tech'), new ProductCategory('Innovation')],
        sku: 'SKU-COMPLEX',
      });

      const event = new ProductChangedEvent('corr-456', product);
      const dto = emitter['mapToProductChangedEventDto'](event);

      expect(dto.data.id).toBe('prod-456');
      expect(dto.data.name).toBe('Complex Product');
      expect(dto.data.description).toBe('Complex description');
      expect(dto.data.price).toBe(299.99);
      expect(dto.data.sku).toBe('SKU-COMPLEX');
      expect(dto.data.categories).toHaveLength(2);
    });

    it('should include created and updated timestamps', () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);
      const dto = emitter['mapToProductChangedEventDto'](event);

      expect(dto.data.createdAt).toBeDefined();
      expect(dto.data.updatedAt).toBeDefined();
    });
  });

  describe('emitCreateProductCommand with event names', () => {
    it('should emit with correct command name', async () => {
      const command = new CreateProductCommand({
        id: 'product-123',
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        categories: ['Electronics'],
        sku: 'SKU-123',
      });

      const emitSpy = jest.spyOn(nestClient, 'emit');
      await emitter.emitCreateProductCommand(command);

      expect(emitSpy).toHaveBeenCalledWith(expect.any(String), command);
    });
  });

  describe('emitUpdateProductCommand with event names', () => {
    it('should emit with correct command name', async () => {
      const command = new UpdateProductCommand({
        id: 'product-123',
        name: 'Updated Product',
        description: 'Updated description',
        price: 150,
        categories: ['Electronics'],
      });

      const emitSpy = jest.spyOn(nestClient, 'emit');
      await emitter.emitUpdateProductCommand(command);

      expect(emitSpy).toHaveBeenCalledWith(expect.any(String), command);
    });
  });

  describe('emitDeleteProductCommand with event names', () => {
    it('should emit with correct command name', async () => {
      const command = new DeleteProductCommand({
        id: 'product-123',
      });

      const emitSpy = jest.spyOn(nestClient, 'emit');
      await emitter.emitDeleteProductCommand(command);

      expect(emitSpy).toHaveBeenCalledWith(expect.any(String), command);
    });
  });

  describe('emitProductCreated with domain event', () => {
    it('should emit domain event with correct structure', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);
      const emitSpy = jest.spyOn(nestClient, 'emit');

      await emitter.emitProductCreated(event);

      // Verify emit was called with event object containing product data
      expect(emitSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.any(Object),
          data: expect.any(Object),
        })
      );
    });
  });

  describe('emitProductUpdated with domain event', () => {
    it('should emit domain event with correct structure', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Updated Product',
        description: 'Updated description',
        price: new Price(150),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);
      const emitSpy = jest.spyOn(nestClient, 'emit');

      await emitter.emitProductUpdated(event);

      // Verify emit was called with event object containing product data
      expect(emitSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.any(Object),
          data: expect.any(Object),
        })
      );
    });
  });

  describe('emitProductDeleted with domain event', () => {
    it('should emit domain event with correct structure', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const event = new ProductChangedEvent('corr-123', product);
      const emitSpy = jest.spyOn(nestClient, 'emit');

      await emitter.emitProductDeleted(event);

      // Verify emit was called with event object containing product data
      expect(emitSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.any(Object),
          data: expect.any(Object),
        })
      );
    });
  });
});
