import { ProductCategory } from './product-category.vo';

describe('ProductCategory', () => {
  describe('constructor', () => {
    it('should create a valid category with alphanumeric characters and spaces', () => {
      const category = new ProductCategory('Electronics');
      expect(category.getValue()).toBe('Electronics');
    });

    it('should create a valid category with numbers', () => {
      const category = new ProductCategory('Category 123');
      expect(category.getValue()).toBe('Category 123');
    });

    it('should throw error when category is empty string', () => {
      expect(() => new ProductCategory('')).toThrow('Product category name cannot be empty');
    });

    it('should throw error when category is only whitespace', () => {
      expect(() => new ProductCategory('   ')).toThrow('Product category name cannot be empty');
    });

    it('should throw error when category contains special characters', () => {
      expect(() => new ProductCategory('Electronics@')).toThrow(
        'Product category name can only contain letters, numbers, and spaces'
      );
    });

    it('should throw error when category contains hyphens', () => {
      expect(() => new ProductCategory('Home-Appliances')).toThrow(
        'Product category name can only contain letters, numbers, and spaces'
      );
    });

    it('should throw error when category contains underscores', () => {
      expect(() => new ProductCategory('Home_Appliances')).toThrow(
        'Product category name can only contain letters, numbers, and spaces'
      );
    });

    it('should accept mixed case', () => {
      const category = new ProductCategory('Home Appliances');
      expect(category.getValue()).toBe('Home Appliances');
    });
  });

  describe('equals', () => {
    it('should return true when categories have the same value', () => {
      const category1 = new ProductCategory('Electronics');
      const category2 = new ProductCategory('Electronics');
      expect(category1.equals(category2)).toBe(true);
    });

    it('should return false when categories have different values', () => {
      const category1 = new ProductCategory('Electronics');
      const category2 = new ProductCategory('Books');
      expect(category1.equals(category2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const category1 = new ProductCategory('Electronics');
      const category2 = new ProductCategory('electronics');
      expect(category1.equals(category2)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the category value', () => {
      const category = new ProductCategory('Home Appliances');
      expect(category.getValue()).toBe('Home Appliances');
    });
  });
});
