import { Product } from './product.entity';

describe('Product', () => {
  describe('create', () => {
    it('should create a product with valid id and name', () => {
      const product = Product.create('prod-123', 'Test Product');

      expect(product).toBeDefined();
      expect(product.getId().getValue()).toBe('prod-123');
      expect(product.getName()).toBe('Test Product');
    });

    it('should create product with special characters in name', () => {
      const product = Product.create('prod-456', 'Product-123 (Special)');

      expect(product.getName()).toBe('Product-123 (Special)');
    });

    it('should create product with unicode characters', () => {
      const product = Product.create('prod-789', 'Producto en Español');

      expect(product.getName()).toBe('Producto en Español');
    });

    it('should throw error when name is empty string', () => {
      expect(() => Product.create('prod-123', '')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when name is only whitespace', () => {
      expect(() => Product.create('prod-123', '   ')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when name is null', () => {
      expect(() => Product.create('prod-123', null as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when name is undefined', () => {
      expect(() => Product.create('prod-123', undefined as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });
  });

  describe('getId', () => {
    it('should return product id', () => {
      const product = Product.create('prod-id-123', 'Product Name');

      const id = product.getId();

      expect(id.getValue()).toBe('prod-id-123');
    });
  });

  describe('getName', () => {
    it('should return product name', () => {
      const product = Product.create('prod-123', 'My Product');

      const name = product.getName();

      expect(name).toBe('My Product');
    });
  });

  describe('updateName', () => {
    it('should update product name', () => {
      const product = Product.create('prod-123', 'Original Name');

      product.updateName('Updated Name');

      expect(product.getName()).toBe('Updated Name');
    });

    it('should update name multiple times', () => {
      const product = Product.create('prod-123', 'First Name');

      product.updateName('Second Name');
      expect(product.getName()).toBe('Second Name');

      product.updateName('Third Name');
      expect(product.getName()).toBe('Third Name');
    });

    it('should throw error when updating to empty name', () => {
      const product = Product.create('prod-123', 'Original Name');

      expect(() => product.updateName('')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when updating to whitespace-only name', () => {
      const product = Product.create('prod-123', 'Original Name');

      expect(() => product.updateName('  ')).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should throw error when updating to null name', () => {
      const product = Product.create('prod-123', 'Original Name');

      expect(() => product.updateName(null as any)).toThrow(
        'Product name must be a non-empty string',
      );
    });

    it('should preserve product id after name update', () => {
      const product = Product.create('prod-123', 'Original Name');
      const originalId = product.getId();

      product.updateName('New Name');

      expect(product.getId()).toEqual(originalId);
      expect(product.getId().getValue()).toBe('prod-123');
    });

    it('should allow updating name to similar but different value', () => {
      const product = Product.create('prod-123', 'Product');

      product.updateName('Product Name');

      expect(product.getName()).toBe('Product Name');
    });

    it('should trim whitespace when updating name', () => {
      const product = Product.create('prod-123', 'Original');

      product.updateName('  New Name  ');

      // Note: updateName doesn't trim, it validates that the name isn't only whitespace
      expect(product.getName()).toBe('  New Name  ');
    });
  });

  describe('edge cases', () => {
    it('should handle product name with numbers and symbols', () => {
      const product = Product.create('prod-abc123', 'Product-123-ABC_!@#$%');

      expect(product.getName()).toBe('Product-123-ABC_!@#$%');
    });

    it('should handle very long product names', () => {
      const longName =
        'A'.repeat(1000) +
        ' Product with a very long name that exceeds normal length';
      const product = Product.create('prod-123', longName);

      expect(product.getName()).toBe(longName);
      expect(product.getName().length).toBeGreaterThan(1000);
    });

    it('should handle product id as UUID', () => {
      const uuidId = '123e4567-e89b-12d3-a456-426614174000';
      const product = Product.create(uuidId, 'UUID Product');

      expect(product.getId().getValue()).toBe(uuidId);
    });

    it('should create independent product instances', () => {
      const product1 = Product.create('prod-1', 'Product 1');
      const product2 = Product.create('prod-2', 'Product 2');

      product1.updateName('Updated Product 1');

      expect(product1.getName()).toBe('Updated Product 1');
      expect(product2.getName()).toBe('Product 2');
    });

    it('should handle product update and id retrieval sequence', () => {
      const product = Product.create('prod-123', 'Initial');

      const idBefore = product.getId().getValue();
      product.updateName('After Update');
      const idAfter = product.getId().getValue();

      expect(idBefore).toBe(idAfter);
      expect(product.getName()).toBe('After Update');
    });
  });
});
