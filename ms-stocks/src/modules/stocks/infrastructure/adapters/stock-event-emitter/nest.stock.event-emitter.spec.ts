import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { CreateStockMovementCommand } from '../../../commands/create-stock-movement.command';
import { CommandNames, DomainEventNames } from '../../../configs/stocks.consts';
import { Stock } from '../../../domain/entities/stock.entity';
import { StockChangedEvent } from '../../../domain/events/stock-changed.event';
import { AvailableStock } from '../../../domain/value-objects/available-stock.vo';
import { CorrelationId } from '../../../domain/value-objects/correlation-id.vo';
import { ProductId } from '../../../domain/value-objects/product-id.vo';
import { NestStockEventEmitter } from './nest.stock.event-emitter';

describe('NestStockEventEmitter', () => {
  let eventEmitter: NestStockEventEmitter;
  let mockNestClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    mockNestClient = {
      emit: jest.fn().mockReturnValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestStockEventEmitter,
        {
          provide: EVENT_STREAMING_CLIENT,
          useValue: mockNestClient,
        },
      ],
    }).compile();

    eventEmitter = module.get<NestStockEventEmitter>(NestStockEventEmitter);
  });

  it('should be defined', () => {
    expect(eventEmitter).toBeDefined();
  });

  describe('emitCreateStockMovementCommand', () => {
    it('should emit create stock movement command', async () => {
      const command = new CreateStockMovementCommand({
        productId: 'prod-123',
        quantity: 50,
        type: 'IN',
      });

      await eventEmitter.emitCreateStockMovementCommand(command);

      expect(mockNestClient.emit).toHaveBeenCalledWith(
        CommandNames.CREATE_STOCK_MOVEMENT,
        command,
      );
    });

    it('should emit command with correct event name', async () => {
      const command = new CreateStockMovementCommand({
        productId: 'prod-456',
        quantity: 30,
        type: 'OUT',
      });

      await eventEmitter.emitCreateStockMovementCommand(command);

      expect(mockNestClient.emit).toHaveBeenCalledWith(
        expect.any(String),
        command,
      );
    });

    it('should handle multiple concurrent command emissions', async () => {
      const commands = [
        new CreateStockMovementCommand({
          productId: 'prod-1',
          quantity: 50,
          type: 'IN',
        }),
        new CreateStockMovementCommand({
          productId: 'prod-2',
          quantity: 30,
          type: 'OUT',
        }),
      ];

      await Promise.all(
        commands.map((cmd) => eventEmitter.emitCreateStockMovementCommand(cmd)),
      );

      expect(mockNestClient.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitStockCreated', () => {
    it('should emit stock created event', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);

      expect(mockNestClient.emit).toHaveBeenCalledWith(
        DomainEventNames.STOCK_CREATED,
        expect.objectContaining({
          metadata: expect.objectContaining({
            correlationId: 'corr-456',
            timestamp: expect.any(Date),
          }),
          data: expect.objectContaining({
            productId: 'prod-123',
            productName: 'Test Product',
            stock: 100,
          }),
        }),
      );
    });

    it('should map stock entity to DTO correctly', async () => {
      const productId = new ProductId('prod-789');
      const correlationId = new CorrelationId('corr-789');
      const stock = Stock.create(
        productId,
        'Mapped Product',
        new AvailableStock(250),
      );
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.productId).toBe('prod-789');
      expect(emittedData.data.productName).toBe('Mapped Product');
      expect(emittedData.data.stock).toBe(250);
    });

    it('should include movements in emitted event', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(20), 'OUT');

      const event = new StockChangedEvent(correlationId, stock);
      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.movements).toHaveLength(2);
      expect(emittedData.data.movements[0].movementType).toBe('IN');
      expect(emittedData.data.movements[0].amount).toBe(50);
      expect(emittedData.data.movements[1].movementType).toBe('OUT');
      expect(emittedData.data.movements[1].amount).toBe(20);
    });
  });

  describe('emitStockUpdated', () => {
    it('should emit stock updated event', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(
        productId,
        'Updated Product',
        new AvailableStock(150),
      );
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockUpdated(event);

      expect(mockNestClient.emit).toHaveBeenCalledWith(
        DomainEventNames.STOCK_UPDATED,
        expect.any(Object),
      );
    });

    it('should map timestamp in metadata', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const timestamp = new Date('2024-06-15T12:00:00Z');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const event = new StockChangedEvent(correlationId, stock, timestamp);

      await eventEmitter.emitStockUpdated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.metadata.timestamp).toBeDefined();
    });
  });

  describe('emitStockDeleted', () => {
    it('should emit stock deleted event', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(
        productId,
        'Deleted Product',
        new AvailableStock(200),
      );
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockDeleted(event);

      expect(mockNestClient.emit).toHaveBeenCalledWith(
        DomainEventNames.STOCK_DELETED,
        expect.any(Object),
      );
    });

    it('should include all stock data in deleted event', async () => {
      const productId = new ProductId('prod-delete-test');
      const correlationId = new CorrelationId('corr-delete');
      const stock = Stock.create(
        productId,
        'Product to Delete',
        new AvailableStock(300),
      );
      stock.addMovement(new AvailableStock(100), 'IN');

      const event = new StockChangedEvent(correlationId, stock);
      await eventEmitter.emitStockDeleted(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.productId).toBe('prod-delete-test');
      expect(emittedData.data.productName).toBe('Product to Delete');
      expect(emittedData.data.stock).toBe(400); // 300 + 100 IN movement
      expect(emittedData.data.movements).toHaveLength(1);
    });
  });

  describe('event mapping', () => {
    it('should correctly map correlation id value', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('special-corr-id');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.metadata.correlationId).toBe('special-corr-id');
    });

    it('should map createdAt and updatedAt timestamps', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const now = new Date();
      const stock = Stock.create(
        productId,
        'Test',
        new AvailableStock(100),
        [],
        now,
        now,
      );
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.createdAt).toEqual(now);
      expect(emittedData.data.updatedAt).toEqual(now);
    });

    it('should handle empty movements array', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.movements).toEqual([]);
    });

    it('should map movement dates correctly', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      stock.addMovement(new AvailableStock(50), 'IN');

      const event = new StockChangedEvent(correlationId, stock);
      await eventEmitter.emitStockCreated(event);

      const emittedData = (mockNestClient.emit as jest.Mock).mock.calls[0][1];
      expect(emittedData.data.movements[0].createdAt).toBeDefined();
    });
  });

  describe('event emission patterns', () => {
    it('should emit different events with correct event names', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const event = new StockChangedEvent(correlationId, stock);

      await eventEmitter.emitStockCreated(event);
      await eventEmitter.emitStockUpdated(event);
      await eventEmitter.emitStockDeleted(event);

      const calls = (mockNestClient.emit as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe(DomainEventNames.STOCK_CREATED);
      expect(calls[1][0]).toBe(DomainEventNames.STOCK_UPDATED);
      expect(calls[2][0]).toBe(DomainEventNames.STOCK_DELETED);
    });

    it('should handle concurrent event emissions', async () => {
      const productId = new ProductId('prod-123');
      const correlationId = new CorrelationId('corr-456');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const event = new StockChangedEvent(correlationId, stock);

      await Promise.all([
        eventEmitter.emitStockCreated(event),
        eventEmitter.emitStockUpdated(event),
        eventEmitter.emitStockDeleted(event),
      ]);

      expect(mockNestClient.emit).toHaveBeenCalledTimes(3);
    });
  });
});
