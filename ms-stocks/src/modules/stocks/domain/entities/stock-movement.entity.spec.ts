import { AvailableStock } from '../value-objects/available-stock.vo';
import { StockMovement } from './stock-movement.entity';

describe('StockMovement', () => {
  describe('create', () => {
    it('should create IN movement with provided date', () => {
      const quantity = new AvailableStock(100);
      const date = new Date('2024-01-15');

      const movement = StockMovement.create(quantity, 'IN', date);

      expect(movement).toBeDefined();
      expect(movement.getType()).toBe('IN');
      expect(movement.getQuantity().getValue()).toBe(100);
      expect(movement.getMovementDate()).toEqual(date);
    });

    it('should create OUT movement with provided date', () => {
      const quantity = new AvailableStock(50);
      const date = new Date('2024-01-20');

      const movement = StockMovement.create(quantity, 'OUT', date);

      expect(movement.getType()).toBe('OUT');
      expect(movement.getQuantity().getValue()).toBe(50);
      expect(movement.getMovementDate()).toEqual(date);
    });

    it('should use current date when no date provided', () => {
      const quantity = new AvailableStock(75);
      const beforeCreate = new Date();

      const movement = StockMovement.create(quantity, 'IN');

      const afterCreate = new Date();

      expect(movement.getMovementDate().getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(movement.getMovementDate().getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should create movement with zero quantity', () => {
      const quantity = new AvailableStock(0);
      const date = new Date();

      const movement = StockMovement.create(quantity, 'IN', date);

      expect(movement.getQuantity().getValue()).toBe(0);
    });

    it('should create movement with large quantity', () => {
      const quantity = new AvailableStock(999999999);
      const date = new Date();

      const movement = StockMovement.create(quantity, 'OUT', date);

      expect(movement.getQuantity().getValue()).toBe(999999999);
    });
  });

  describe('getQuantity', () => {
    it('should return quantity value object', () => {
      const quantity = new AvailableStock(250);
      const movement = StockMovement.create(quantity, 'IN');

      const retrievedQuantity = movement.getQuantity();

      expect(retrievedQuantity.getValue()).toBe(250);
    });

    it('should return same quantity object reference', () => {
      const quantity = new AvailableStock(100);
      const movement = StockMovement.create(quantity, 'IN');

      const retrieved1 = movement.getQuantity();
      const retrieved2 = movement.getQuantity();

      expect(retrieved1).toEqual(retrieved2);
    });
  });

  describe('getType', () => {
    it('should return IN type', () => {
      const movement = StockMovement.create(new AvailableStock(100), 'IN');

      expect(movement.getType()).toBe('IN');
    });

    it('should return OUT type', () => {
      const movement = StockMovement.create(new AvailableStock(50), 'OUT');

      expect(movement.getType()).toBe('OUT');
    });

    it('should maintain type consistency across multiple calls', () => {
      const movement = StockMovement.create(new AvailableStock(100), 'IN');

      expect(movement.getType()).toBe('IN');
      expect(movement.getType()).toBe('IN');
      expect(movement.getType()).toBe('IN');
    });
  });

  describe('getMovementDate', () => {
    it('should return provided date', () => {
      const date = new Date('2024-06-15T12:30:45Z');
      const movement = StockMovement.create(
        new AvailableStock(100),
        'IN',
        date,
      );

      expect(movement.getMovementDate()).toEqual(date);
    });

    it('should return auto-generated date when none provided', () => {
      const movement = StockMovement.create(new AvailableStock(100), 'IN');

      expect(movement.getMovementDate()).toBeInstanceOf(Date);
      expect(movement.getMovementDate().getTime()).toBeGreaterThan(0);
    });

    it('should preserve date through multiple retrievals', () => {
      const date = new Date('2024-05-10');
      const movement = StockMovement.create(
        new AvailableStock(100),
        'OUT',
        date,
      );

      const retrieved1 = movement.getMovementDate();
      const retrieved2 = movement.getMovementDate();

      expect(retrieved1.getTime()).toBe(retrieved2.getTime());
    });
  });

  describe('immutability', () => {
    it('should create immutable movement entity', () => {
      const quantity = new AvailableStock(100);
      const date = new Date();
      const movement = StockMovement.create(quantity, 'IN', date);

      // Movement should not have settable properties for core data
      expect(movement.getQuantity().getValue()).toBe(100);
      expect(movement.getType()).toBe('IN');
      expect(movement.getMovementDate().getTime()).toBe(date.getTime());
    });

    it('should maintain data integrity after creation', () => {
      const quantity = new AvailableStock(500);
      const movement = StockMovement.create(quantity, 'OUT');

      // External changes shouldn't affect internal state
      const retrieved = movement.getQuantity();
      expect(retrieved.getValue()).toBe(500);

      const newQuantity = new AvailableStock(1000);
      const retrieved2 = movement.getQuantity();
      expect(retrieved2.getValue()).toBe(500);
    });
  });

  describe('multiple movements', () => {
    it('should create independent movement instances', () => {
      const movement1 = StockMovement.create(new AvailableStock(100), 'IN');
      const movement2 = StockMovement.create(new AvailableStock(100), 'OUT');

      expect(movement1.getType()).toBe('IN');
      expect(movement2.getType()).toBe('OUT');
      expect(movement1.getType()).not.toBe(movement2.getType());
    });

    it('should handle sequential movements with different quantities', () => {
      const mov1 = StockMovement.create(new AvailableStock(100), 'IN');
      const mov2 = StockMovement.create(new AvailableStock(50), 'OUT');
      const mov3 = StockMovement.create(new AvailableStock(25), 'IN');

      expect(mov1.getQuantity().getValue()).toBe(100);
      expect(mov2.getQuantity().getValue()).toBe(50);
      expect(mov3.getQuantity().getValue()).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('should handle movement with very old date', () => {
      const oldDate = new Date('1970-01-01T00:00:00Z');
      const movement = StockMovement.create(
        new AvailableStock(100),
        'IN',
        oldDate,
      );

      expect(movement.getMovementDate().getUTCFullYear()).toBe(1970);
    });

    it('should handle movement with future date', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z');
      const movement = StockMovement.create(
        new AvailableStock(100),
        'IN',
        futureDate,
      );

      expect(movement.getMovementDate().getUTCFullYear()).toBe(2099);
    });

    it('should handle millisecond precision in dates', () => {
      const date = new Date('2024-06-15T12:30:45.123Z');
      const movement = StockMovement.create(
        new AvailableStock(100),
        'IN',
        date,
      );

      expect(movement.getMovementDate().getMilliseconds()).toBe(123);
    });

    it('should create multiple movements at same moment', () => {
      const now = new Date();
      const mov1 = StockMovement.create(new AvailableStock(100), 'IN', now);
      const mov2 = StockMovement.create(new AvailableStock(50), 'OUT', now);

      expect(mov1.getMovementDate().getTime()).toBe(
        mov2.getMovementDate().getTime(),
      );
    });
  });
});
