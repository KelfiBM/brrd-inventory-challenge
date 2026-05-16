import { Price } from './price.vo';

describe('Price', () => {
  describe('constructor', () => {
    it('should create a valid price with a positive number', () => {
      const price = new Price(100);
      expect(price.getValue()).toBe(100);
    });

    it('should create a price with zero', () => {
      const price = new Price(0);
      expect(price.getValue()).toBe(0);
    });

    it('should throw error when price is negative', () => {
      expect(() => new Price(-10)).toThrow('Price cannot be negative');
    });

    it('should handle decimal prices', () => {
      const price = new Price(99.99);
      expect(price.getValue()).toBe(99.99);
    });

    it('should handle very large prices', () => {
      const price = new Price(1000000.5);
      expect(price.getValue()).toBe(1000000.5);
    });
  });

  describe('equals', () => {
    it('should return true when prices have the same value', () => {
      const price1 = new Price(100);
      const price2 = new Price(100);
      expect(price1.equals(price2)).toBe(true);
    });

    it('should return false when prices have different values', () => {
      const price1 = new Price(100);
      const price2 = new Price(200);
      expect(price1.equals(price2)).toBe(false);
    });

    it('should work correctly with decimal prices', () => {
      const price1 = new Price(99.99);
      const price2 = new Price(99.99);
      expect(price1.equals(price2)).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should return the price value', () => {
      const price = new Price(150.5);
      expect(price.getValue()).toBe(150.5);
    });
  });
});
