import { StockNotEnoughError } from '../errors/stock-not-enough.error';
import { AvailableStock } from '../value-objects/available-stock.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { StockMovement } from './stock-movement.entity';
import { Stock } from './stock.entity';

describe('Stock', () => {
  describe('create', () => {
    it('should create stock with all parameters', () => {
      const productId = new ProductId('prod-123');
      const productName = 'Test Product';
      const stock = new AvailableStock(100);
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');

      const result = Stock.create(
        productId,
        productName,
        stock,
        [],
        createdAt,
        updatedAt,
      );

      expect(result).toBeDefined();
      expect(result.getId().getValue()).toBe('prod-123');
      expect(result.getName()).toBe('Test Product');
      expect(result.getStock().getValue()).toBe(100);
      expect(result.getCreatedAt()).toEqual(createdAt);
      expect(result.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should create stock with optional stock parameter defaulting to 0', () => {
      const productId = new ProductId('prod-456');
      const productName = 'New Product';

      const result = Stock.create(productId, productName);

      expect(result.getStock().getValue()).toBe(0);
    });

    it('should create stock with provided stock value', () => {
      const productId = new ProductId('prod-789');
      const stock = new AvailableStock(250);

      const result = Stock.create(productId, 'Product Name', stock);

      expect(result.getStock().getValue()).toBe(250);
    });

    it('should create stock with empty movements array by default', () => {
      const productId = new ProductId('prod-101');

      const result = Stock.create(productId, 'Product');

      expect(result.getMovements()).toEqual([]);
      expect(result.getMovements().length).toBe(0);
    });

    it('should create stock with provided movements', () => {
      const productId = new ProductId('prod-202');
      const movement1 = StockMovement.create(new AvailableStock(50), 'IN');
      const movement2 = StockMovement.create(new AvailableStock(20), 'OUT');
      const movements = [movement1, movement2];

      const result = Stock.create(productId, 'Product', undefined, movements);

      expect(result.getMovements()).toEqual(movements);
      expect(result.getMovements().length).toBe(2);
    });

    it('should use current date for createdAt when not provided', () => {
      const productId = new ProductId('prod-303');
      const beforeCreate = new Date();

      const result = Stock.create(productId, 'Product');

      const afterCreate = new Date();

      expect(result.getCreatedAt().getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(result.getCreatedAt().getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should use current date for updatedAt when not provided', () => {
      const productId = new ProductId('prod-404');
      const beforeCreate = new Date();

      const result = Stock.create(productId, 'Product');

      const afterCreate = new Date();

      expect(result.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(result.getUpdatedAt().getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should use provided createdAt date', () => {
      const productId = new ProductId('prod-505');
      const createdAt = new Date('2023-12-25');

      const result = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        createdAt,
      );

      expect(result.getCreatedAt()).toEqual(createdAt);
    });

    it('should use provided updatedAt date', () => {
      const productId = new ProductId('prod-606');
      const updatedAt = new Date('2024-06-15');

      const result = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        undefined,
        updatedAt,
      );

      expect(result.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should throw error for empty product name', () => {
      const productId = new ProductId('prod-707');

      expect(() => Stock.create(productId, '')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error for whitespace-only product name', () => {
      const productId = new ProductId('prod-808');

      expect(() => Stock.create(productId, '   ')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error for null product name', () => {
      const productId = new ProductId('prod-909');

      expect(() => Stock.create(productId, null as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error for undefined product name', () => {
      const productId = new ProductId('prod-1010');

      expect(() => Stock.create(productId, undefined as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should create stock with special characters in name', () => {
      const productId = new ProductId('prod-1111');

      const result = Stock.create(productId, 'Product-123 (Special)');

      expect(result.getName()).toBe('Product-123 (Special)');
    });

    it('should create stock with unicode characters in name', () => {
      const productId = new ProductId('prod-1212');

      const result = Stock.create(productId, 'Producto en Español');

      expect(result.getName()).toBe('Producto en Español');
    });

    it('should create multiple independent stock instances', () => {
      const productId1 = new ProductId('prod-1313');
      const productId2 = new ProductId('prod-1414');

      const stock1 = Stock.create(
        productId1,
        'Product 1',
        new AvailableStock(100),
      );
      const stock2 = Stock.create(
        productId2,
        'Product 2',
        new AvailableStock(200),
      );

      expect(stock1.getId().getValue()).toBe('prod-1313');
      expect(stock2.getId().getValue()).toBe('prod-1414');
      expect(stock1.getStock().getValue()).toBe(100);
      expect(stock2.getStock().getValue()).toBe(200);
    });
  });

  describe('getId', () => {
    it('should return the product id', () => {
      const productId = new ProductId('prod-id-123');
      const stock = Stock.create(productId, 'Product');

      const id = stock.getId();

      expect(id.getValue()).toBe('prod-id-123');
    });

    it('should return same product id object reference', () => {
      const productId = new ProductId('prod-id-456');
      const stock = Stock.create(productId, 'Product');

      const id1 = stock.getId();
      const id2 = stock.getId();

      expect(id1.getValue()).toBe(id2.getValue());
    });
  });

  describe('getName', () => {
    it('should return the product name', () => {
      const productId = new ProductId('prod-name-123');

      const stock = Stock.create(productId, 'My Product Name');

      expect(stock.getName()).toBe('My Product Name');
    });

    it('should return updated name after updateName call', () => {
      const productId = new ProductId('prod-name-456');
      const stock = Stock.create(productId, 'Original Name');

      stock.updateName('Updated Name');

      expect(stock.getName()).toBe('Updated Name');
    });
  });

  describe('getStock', () => {
    it('should return available stock value object', () => {
      const productId = new ProductId('prod-stock-123');
      const stock = Stock.create(productId, 'Product', new AvailableStock(150));

      const availableStock = stock.getStock();

      expect(availableStock.getValue()).toBe(150);
    });

    it('should return stock after IN movement', () => {
      const productId = new ProductId('prod-stock-456');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getStock().getValue()).toBe(150);
    });

    it('should return stock after OUT movement', () => {
      const productId = new ProductId('prod-stock-789');
      const stock = Stock.create(productId, 'Product', new AvailableStock(200));

      stock.addMovement(new AvailableStock(30), 'OUT');

      expect(stock.getStock().getValue()).toBe(170);
    });
  });

  describe('getCreatedAt', () => {
    it('should return created at date', () => {
      const productId = new ProductId('prod-created-123');
      const createdAt = new Date('2024-01-10');

      const stock = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        createdAt,
      );

      expect(stock.getCreatedAt()).toEqual(createdAt);
    });

    it('should return unchanged created at after updates', () => {
      const productId = new ProductId('prod-created-456');
      const createdAt = new Date('2024-01-10');
      const stock = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        createdAt,
      );

      stock.updateName('New Name');
      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getCreatedAt()).toEqual(createdAt);
    });
  });

  describe('getUpdatedAt', () => {
    it('should return updated at date', () => {
      const productId = new ProductId('prod-updated-123');
      const updatedAt = new Date('2024-01-15');

      const stock = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        undefined,
        updatedAt,
      );

      expect(stock.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should update the date when updateName is called', () => {
      const productId = new ProductId('prod-updated-456');
      const oldUpdatedAt = new Date('2024-01-10');
      const stock = Stock.create(
        productId,
        'Product',
        undefined,
        [],
        undefined,
        oldUpdatedAt,
      );
      const beforeUpdate = new Date();

      stock.updateName('New Name');

      const afterUpdate = new Date();

      expect(stock.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(stock.getUpdatedAt().getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it('should update the date when addMovement is called', () => {
      const productId = new ProductId('prod-updated-789');
      const oldUpdatedAt = new Date('2024-01-10');
      const stock = Stock.create(
        productId,
        'Product',
        new AvailableStock(100),
        [],
        undefined,
        oldUpdatedAt,
      );
      const beforeUpdate = new Date();

      stock.addMovement(new AvailableStock(50), 'IN');

      const afterUpdate = new Date();

      expect(stock.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(stock.getUpdatedAt().getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe('getMovements', () => {
    it('should return empty movements array for new stock', () => {
      const productId = new ProductId('prod-mov-123');

      const stock = Stock.create(productId, 'Product');

      expect(stock.getMovements()).toEqual([]);
    });

    it('should return provided movements on creation', () => {
      const productId = new ProductId('prod-mov-456');
      const movement1 = StockMovement.create(new AvailableStock(50), 'IN');
      const movement2 = StockMovement.create(new AvailableStock(30), 'OUT');

      const stock = Stock.create(productId, 'Product', undefined, [
        movement1,
        movement2,
      ]);

      expect(stock.getMovements().length).toBe(2);
      expect(stock.getMovements()[0]).toEqual(movement1);
      expect(stock.getMovements()[1]).toEqual(movement2);
    });

    it('should include new movement after addMovement call', () => {
      const productId = new ProductId('prod-mov-789');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getMovements().length).toBe(1);
      expect(stock.getMovements()[0].getQuantity().getValue()).toBe(50);
      expect(stock.getMovements()[0].getType()).toBe('IN');
    });

    it('should track multiple movements in order', () => {
      const productId = new ProductId('prod-mov-1010');
      const stock = Stock.create(productId, 'Product', new AvailableStock(200));

      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(30), 'OUT');
      stock.addMovement(new AvailableStock(20), 'IN');

      expect(stock.getMovements().length).toBe(3);
      expect(stock.getMovements()[0].getType()).toBe('IN');
      expect(stock.getMovements()[1].getType()).toBe('OUT');
      expect(stock.getMovements()[2].getType()).toBe('IN');
    });
  });

  describe('updateName', () => {
    it('should update product name to new value', () => {
      const productId = new ProductId('prod-upd-123');
      const stock = Stock.create(productId, 'Original Name');

      stock.updateName('Updated Name');

      expect(stock.getName()).toBe('Updated Name');
    });

    it('should update name multiple times', () => {
      const productId = new ProductId('prod-upd-456');
      const stock = Stock.create(productId, 'First Name');

      stock.updateName('Second Name');
      expect(stock.getName()).toBe('Second Name');

      stock.updateName('Third Name');
      expect(stock.getName()).toBe('Third Name');

      stock.updateName('Fourth Name');
      expect(stock.getName()).toBe('Fourth Name');
    });

    it('should preserve stock quantity after name update', () => {
      const productId = new ProductId('prod-upd-789');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.updateName('New Name');

      expect(stock.getStock().getValue()).toBe(100);
    });

    it('should preserve movements after name update', () => {
      const productId = new ProductId('prod-upd-1010');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));
      stock.addMovement(new AvailableStock(50), 'IN');

      stock.updateName('New Name');

      expect(stock.getMovements().length).toBe(1);
      expect(stock.getMovements()[0].getQuantity().getValue()).toBe(50);
    });

    it('should throw error when updating to empty name', () => {
      const productId = new ProductId('prod-upd-1111');
      const stock = Stock.create(productId, 'Original Name');

      expect(() => stock.updateName('')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when updating to whitespace-only name', () => {
      const productId = new ProductId('prod-upd-1212');
      const stock = Stock.create(productId, 'Original Name');

      expect(() => stock.updateName('   ')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when updating to null name', () => {
      const productId = new ProductId('prod-upd-1313');
      const stock = Stock.create(productId, 'Original Name');

      expect(() => stock.updateName(null as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when updating to undefined name', () => {
      const productId = new ProductId('prod-upd-1414');
      const stock = Stock.create(productId, 'Original Name');

      expect(() => stock.updateName(undefined as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should update name with special characters', () => {
      const productId = new ProductId('prod-upd-1515');
      const stock = Stock.create(productId, 'Original');

      stock.updateName('Updated-Product (Special)');

      expect(stock.getName()).toBe('Updated-Product (Special)');
    });
  });

  describe('addMovement', () => {
    it('should add IN movement and increase stock', () => {
      const productId = new ProductId('prod-add-123');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getStock().getValue()).toBe(150);
    });

    it('should add OUT movement and decrease stock', () => {
      const productId = new ProductId('prod-add-456');
      const stock = Stock.create(productId, 'Product', new AvailableStock(200));

      stock.addMovement(new AvailableStock(30), 'OUT');

      expect(stock.getStock().getValue()).toBe(170);
    });

    it('should add multiple IN movements', () => {
      const productId = new ProductId('prod-add-789');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(30), 'IN');

      expect(stock.getStock().getValue()).toBe(180);
      expect(stock.getMovements().length).toBe(2);
    });

    it('should add multiple OUT movements', () => {
      const productId = new ProductId('prod-add-1010');
      const stock = Stock.create(productId, 'Product', new AvailableStock(300));

      stock.addMovement(new AvailableStock(50), 'OUT');
      stock.addMovement(new AvailableStock(30), 'OUT');

      expect(stock.getStock().getValue()).toBe(220);
      expect(stock.getMovements().length).toBe(2);
    });

    it('should add mixed IN and OUT movements', () => {
      const productId = new ProductId('prod-add-1111');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(50), 'IN');
      stock.addMovement(new AvailableStock(30), 'OUT');
      stock.addMovement(new AvailableStock(20), 'IN');

      expect(stock.getStock().getValue()).toBe(140);
      expect(stock.getMovements().length).toBe(3);
    });

    it('should add movement with zero quantity', () => {
      const productId = new ProductId('prod-add-1212');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(0), 'IN');

      expect(stock.getStock().getValue()).toBe(100);
      expect(stock.getMovements().length).toBe(1);
    });

    it('should throw error when insufficient stock for OUT movement', () => {
      const productId = new ProductId('prod-add-1313');
      const stock = Stock.create(productId, 'Product', new AvailableStock(50));

      expect(() => stock.addMovement(new AvailableStock(100), 'OUT')).toThrow(
        StockNotEnoughError,
      );
    });

    it('should throw error with correct message when insufficient stock', () => {
      const productId = new ProductId('prod-add-1414');
      const stock = Stock.create(productId, 'Product', new AvailableStock(30));

      expect(() => stock.addMovement(new AvailableStock(50), 'OUT')).toThrow(
        'Insufficient stock for this movement',
      );
    });

    it('should not modify stock when movement fails due to insufficient stock', () => {
      const productId = new ProductId('prod-add-1515');
      const stock = Stock.create(productId, 'Product', new AvailableStock(50));

      try {
        stock.addMovement(new AvailableStock(100), 'OUT');
      } catch {
        // Expected
      }

      expect(stock.getStock().getValue()).toBe(50);
    });

    it('should not add movement to array when movement fails', () => {
      const productId = new ProductId('prod-add-1616');
      const stock = Stock.create(productId, 'Product', new AvailableStock(50));

      try {
        stock.addMovement(new AvailableStock(100), 'OUT');
      } catch {
        // Expected
      }

      expect(stock.getMovements().length).toBe(0);
    });

    it('should allow OUT movement reducing stock to exactly zero', () => {
      const productId = new ProductId('prod-add-1717');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(100), 'OUT');

      expect(stock.getStock().getValue()).toBe(0);
      expect(stock.getMovements().length).toBe(1);
    });

    it('should allow subsequent IN movement after stock reaches zero', () => {
      const productId = new ProductId('prod-add-1818');
      const stock = Stock.create(productId, 'Product', new AvailableStock(100));

      stock.addMovement(new AvailableStock(100), 'OUT');
      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getStock().getValue()).toBe(50);
      expect(stock.getMovements().length).toBe(2);
    });

    it('should add large quantity movement', () => {
      const productId = new ProductId('prod-add-1919');
      const stock = Stock.create(
        productId,
        'Product',
        new AvailableStock(1000000),
      );

      stock.addMovement(new AvailableStock(999999), 'OUT');

      expect(stock.getStock().getValue()).toBe(1);
      expect(stock.getMovements().length).toBe(1);
    });

    it('should update updatedAt timestamp when adding movement', () => {
      const productId = new ProductId('prod-add-2020');
      const oldUpdatedAt = new Date('2024-01-10');
      const stock = Stock.create(
        productId,
        'Product',
        new AvailableStock(100),
        [],
        undefined,
        oldUpdatedAt,
      );
      const beforeAdd = new Date();

      stock.addMovement(new AvailableStock(50), 'IN');

      const afterAdd = new Date();

      expect(stock.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        beforeAdd.getTime(),
      );
      expect(stock.getUpdatedAt().getTime()).toBeLessThanOrEqual(
        afterAdd.getTime(),
      );
    });
  });

  describe('aggregate root semantics', () => {
    it('should maintain aggregate state consistency', () => {
      const productId = new ProductId('prod-agg-123');
      const stock = Stock.create(productId, 'Product', new AvailableStock(500));

      stock.updateName('Updated Product');
      stock.addMovement(new AvailableStock(100), 'IN');
      stock.addMovement(new AvailableStock(50), 'OUT');

      expect(stock.getName()).toBe('Updated Product');
      expect(stock.getId().getValue()).toBe('prod-agg-123');
      expect(stock.getStock().getValue()).toBe(550);
      expect(stock.getMovements().length).toBe(2);
      expect(stock.getCreatedAt()).toBeDefined();
      expect(stock.getUpdatedAt()).toBeDefined();
    });

    it('should maintain immutability of createdAt across lifecycle', () => {
      const productId = new ProductId('prod-agg-456');
      const createdAt = new Date('2024-01-01');
      const stock = Stock.create(
        productId,
        'Product',
        new AvailableStock(100),
        [],
        createdAt,
      );

      stock.updateName('New Name');
      stock.addMovement(new AvailableStock(50), 'IN');

      expect(stock.getCreatedAt()).toEqual(createdAt);
    });

    it('should create independent stock instances', () => {
      const productId1 = new ProductId('prod-ind-123');
      const productId2 = new ProductId('prod-ind-456');

      const stock1 = Stock.create(
        productId1,
        'Product 1',
        new AvailableStock(100),
      );
      const stock2 = Stock.create(
        productId2,
        'Product 2',
        new AvailableStock(200),
      );

      stock1.updateName('Updated 1');
      stock1.addMovement(new AvailableStock(50), 'IN');

      expect(stock1.getName()).toBe('Updated 1');
      expect(stock1.getStock().getValue()).toBe(150);
      expect(stock2.getName()).toBe('Product 2');
      expect(stock2.getStock().getValue()).toBe(200);
      expect(stock2.getMovements().length).toBe(0);
    });
  });
});
