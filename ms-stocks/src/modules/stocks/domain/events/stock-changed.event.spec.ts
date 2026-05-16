import { Stock } from '../entities/stock.entity';
import { AvailableStock } from '../value-objects/available-stock.vo';
import { CorrelationId } from '../value-objects/correlation-id.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { StockChangedEvent } from './stock-changed.event';

describe('StockChangedEvent', () => {
  describe('create', () => {
    it('should create event with stock data and correlation id', () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(
        productId,
        'Test Product',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-123');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event).toBeDefined();
      expect(event.data).toEqual(stock);
      expect(event.metadata.correlationId.getValue()).toBe('corr-123');
    });

    it('should create event with provided timestamp', () => {
      const productId = new ProductId('prod-456');
      const stock = Stock.create(productId, 'Product', new AvailableStock(50));
      const correlationId = new CorrelationId('corr-456');
      const timestamp = new Date('2024-06-15T12:00:00Z');

      const event = new StockChangedEvent(correlationId, stock, timestamp);

      expect(event.metadata.timestamp).toEqual(timestamp);
    });

    it('should auto-generate timestamp when not provided', () => {
      const productId = new ProductId('prod-789');
      const stock = Stock.create(productId, 'Auto', new AvailableStock(75));
      const correlationId = new CorrelationId('corr-789');
      const beforeCreate = new Date();

      const event = new StockChangedEvent(correlationId, stock);

      const afterCreate = new Date();

      expect(event.metadata.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(event.metadata.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should throw error when stock data is null', () => {
      const correlationId = new CorrelationId('corr-123');

      expect(() => new StockChangedEvent(correlationId, null as any)).toThrow(
        'Domain event data cannot be null or undefined.',
      );
    });

    it('should throw error when stock data is undefined', () => {
      const correlationId = new CorrelationId('corr-123');

      expect(
        () => new StockChangedEvent(correlationId, undefined as any),
      ).toThrow('Domain event data cannot be null or undefined.');
    });
  });

  describe('stock data access', () => {
    it('should provide access to stock data through event', () => {
      const productId = new ProductId('prod-access');
      const stock = Stock.create(
        productId,
        'Access Test',
        new AvailableStock(200),
      );
      const correlationId = new CorrelationId('corr-access');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getName()).toBe('Access Test');
      expect(event.data.getId().getValue()).toBe('prod-access');
      expect(event.data.getStock().getValue()).toBe(200);
    });

    it('should preserve stock object integrity in event', () => {
      const productId = new ProductId('prod-integrity');
      const stock = Stock.create(
        productId,
        'Integrity Test',
        new AvailableStock(300),
      );
      const correlationId = new CorrelationId('corr-integrity');

      const event = new StockChangedEvent(correlationId, stock);

      // Verify all stock properties are accessible
      expect(event.data.getId()).toEqual(productId);
      expect(event.data.getName()).toBe('Integrity Test');
      expect(event.data.getStock().getValue()).toBe(300);
      expect(event.data.getCreatedAt()).toBeInstanceOf(Date);
      expect(event.data.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should maintain correlation between event and stock', () => {
      const productId = new ProductId('prod-correlation');
      const stock = Stock.create(
        productId,
        'Stock Name',
        new AvailableStock(150),
      );
      const correlationId = new CorrelationId('corr-event-stock');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.metadata.correlationId.getValue()).toBe('corr-event-stock');
      expect(event.data.getId().getValue()).toBe('prod-correlation');
    });
  });

  describe('event metadata', () => {
    it('should have properly formatted metadata', () => {
      const productId = new ProductId('prod-meta');
      const stock = Stock.create(
        productId,
        'Meta Test',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-meta');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.metadata).toBeDefined();
      expect(event.metadata.correlationId).toBeDefined();
      expect(event.metadata.timestamp).toBeDefined();
    });

    it('should preserve correlation id through event', () => {
      const productId = new ProductId('prod-123');
      const stock = Stock.create(productId, 'Test', new AvailableStock(100));
      const correlationId = new CorrelationId('unique-correlation-123');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.metadata.correlationId.getValue()).toBe(
        'unique-correlation-123',
      );
    });
  });

  describe('multiple events', () => {
    it('should create independent stock changed events', () => {
      const stock1 = Stock.create(
        new ProductId('prod-1'),
        'Product 1',
        new AvailableStock(100),
      );
      const stock2 = Stock.create(
        new ProductId('prod-2'),
        'Product 2',
        new AvailableStock(200),
      );
      const corrId1 = new CorrelationId('corr-1');
      const corrId2 = new CorrelationId('corr-2');

      const event1 = new StockChangedEvent(corrId1, stock1);
      const event2 = new StockChangedEvent(corrId2, stock2);

      expect(event1.data.getId().getValue()).toBe('prod-1');
      expect(event2.data.getId().getValue()).toBe('prod-2');
      expect(event1.metadata.correlationId.getValue()).toBe('corr-1');
      expect(event2.metadata.correlationId.getValue()).toBe('corr-2');
    });

    it('should handle events with same stock but different correlation ids', () => {
      const stock = Stock.create(
        new ProductId('prod-shared'),
        'Shared Stock',
        new AvailableStock(100),
      );
      const corrId1 = new CorrelationId('corr-1');
      const corrId2 = new CorrelationId('corr-2');

      const event1 = new StockChangedEvent(corrId1, stock);
      const event2 = new StockChangedEvent(corrId2, stock);

      expect(event1.data).toEqual(event2.data);
      expect(event1.metadata.correlationId.getValue()).not.toBe(
        event2.metadata.correlationId.getValue(),
      );
    });
  });

  describe('with stock modifications', () => {
    it('should capture stock with initial quantity', () => {
      const productId = new ProductId('prod-qty');
      const stock = Stock.create(
        productId,
        'Quantity Test',
        new AvailableStock(500),
      );
      const correlationId = new CorrelationId('corr-qty');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getStock().getValue()).toBe(500);
    });

    it('should capture stock with zero quantity', () => {
      const productId = new ProductId('prod-zero');
      const stock = Stock.create(
        productId,
        'Zero Stock',
        new AvailableStock(0),
      );
      const correlationId = new CorrelationId('corr-zero');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getStock().getValue()).toBe(0);
    });

    it('should capture stock with large quantity', () => {
      const productId = new ProductId('prod-large');
      const stock = Stock.create(
        productId,
        'Large Stock',
        new AvailableStock(999999999),
      );
      const correlationId = new CorrelationId('corr-large');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getStock().getValue()).toBe(999999999);
    });
  });

  describe('timestamp handling', () => {
    it('should preserve exact timestamp', () => {
      const productId = new ProductId('prod-time');
      const stock = Stock.create(
        productId,
        'Time Test',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-time');
      const timestamp = new Date('2024-06-15T12:30:45.678Z');

      const event = new StockChangedEvent(correlationId, stock, timestamp);

      expect(event.metadata.timestamp.toISOString()).toBe(
        '2024-06-15T12:30:45.678Z',
      );
    });

    it('should handle historical timestamps', () => {
      const productId = new ProductId('prod-historical');
      const stock = Stock.create(
        productId,
        'Historical',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-historical');
      const historicalTimestamp = new Date('2020-01-01T00:00:00Z');

      const event = new StockChangedEvent(
        correlationId,
        stock,
        historicalTimestamp,
      );

      expect(event.metadata.timestamp.getUTCFullYear()).toBe(2020);
    });

    it('should handle future timestamps', () => {
      const productId = new ProductId('prod-future');
      const stock = Stock.create(productId, 'Future', new AvailableStock(100));
      const correlationId = new CorrelationId('corr-future');
      const futureTimestamp = new Date('2099-12-31T23:59:59Z');

      const event = new StockChangedEvent(
        correlationId,
        stock,
        futureTimestamp,
      );

      expect(event.metadata.timestamp.getUTCFullYear()).toBe(2099);
    });
  });

  describe('edge cases', () => {
    it('should handle stock with special product names', () => {
      const productId = new ProductId('prod-special');
      const stock = Stock.create(
        productId,
        'Product-123 (Special) @#$%',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-special');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getName()).toBe('Product-123 (Special) @#$%');
    });

    it('should handle stock with unicode characters', () => {
      const productId = new ProductId('prod-unicode');
      const stock = Stock.create(
        productId,
        'Producto Español 日本製',
        new AvailableStock(100),
      );
      const correlationId = new CorrelationId('corr-unicode');

      const event = new StockChangedEvent(correlationId, stock);

      expect(event.data.getName()).toBe('Producto Español 日本製');
    });

    it('should maintain event integrity through serialization-like access', () => {
      const productId = new ProductId('prod-serialization');
      const stock = Stock.create(
        productId,
        'Serialization Test',
        new AvailableStock(250),
      );
      const correlationId = new CorrelationId('corr-serialization');

      const event = new StockChangedEvent(correlationId, stock);

      // Multiple accesses should return consistent data
      const data1 = event.data;
      const data2 = event.data;
      const data3 = event.data;

      expect(data1.getId().getValue()).toBe(data2.getId().getValue());
      expect(data2.getId().getValue()).toBe(data3.getId().getValue());
    });
  });
});
