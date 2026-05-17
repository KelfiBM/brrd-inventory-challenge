import { AvailableStock } from './available-stock.vo';

describe('AvailableStock', () => {
  describe('constructor', () => {
    it('should create instance with valid stock value', () => {
      const stock = new AvailableStock(100);
      expect(stock).toBeDefined();
      expect(stock.getValue()).toBe(100);
    });

    it('should create instance with zero stock', () => {
      const stock = new AvailableStock(0);
      expect(stock).toBeDefined();
      expect(stock.getValue()).toBe(0);
    });

    it('should create instance with large stock value', () => {
      const stock = new AvailableStock(999999999);
      expect(stock).toBeDefined();
      expect(stock.getValue()).toBe(999999999);
    });

    it('should throw error for negative stock value', () => {
      expect(() => new AvailableStock(-1)).toThrow('Stock cannot be negative');
    });

    it('should throw error for negative stock with large value', () => {
      expect(() => new AvailableStock(-999999)).toThrow(
        'Stock cannot be negative',
      );
    });

    it('should throw error for float negative value', () => {
      expect(() => new AvailableStock(-0.5)).toThrow(
        'Stock cannot be negative',
      );
    });
  });

  describe('getValue', () => {
    it('should return the stock value', () => {
      const stock = new AvailableStock(50);
      expect(stock.getValue()).toBe(50);
    });

    it('should return zero', () => {
      const stock = new AvailableStock(0);
      expect(stock.getValue()).toBe(0);
    });

    it('should return immutable value', () => {
      const stock = new AvailableStock(100);
      const firstCall = stock.getValue();
      const secondCall = stock.getValue();
      expect(firstCall).toBe(secondCall);
    });

    it('should preserve exact value type', () => {
      const stock = new AvailableStock(123);
      const value = stock.getValue();
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(100);
      expect(stock1.equals(stock2)).toBe(true);
    });

    it('should return false for different values', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(50);
      expect(stock1.equals(stock2)).toBe(false);
    });

    it('should return true comparing zero values', () => {
      const stock1 = new AvailableStock(0);
      const stock2 = new AvailableStock(0);
      expect(stock1.equals(stock2)).toBe(true);
    });

    it('should return true comparing large values', () => {
      const stock1 = new AvailableStock(999999999);
      const stock2 = new AvailableStock(999999999);
      expect(stock1.equals(stock2)).toBe(true);
    });

    it('should return false when comparing with greater value', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(101);
      expect(stock1.equals(stock2)).toBe(false);
    });

    it('should return false when comparing with smaller value', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(99);
      expect(stock1.equals(stock2)).toBe(false);
    });

    it('should support chained equality checks', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(100);
      const stock3 = new AvailableStock(100);
      expect(stock1.equals(stock2) && stock2.equals(stock3)).toBe(true);
    });

    it('should not affect internal value when comparing', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(100);
      stock1.equals(stock2);
      stock1.equals(stock2);
      expect(stock1.getValue()).toBe(100);
    });
  });

  describe('value object semantics', () => {
    it('should be immutable', () => {
      const stock = new AvailableStock(100);
      const originalValue = stock.getValue();
      // Attempt to modify (should not affect internal value)
      const newStock = new AvailableStock(originalValue + 50);
      expect(stock.getValue()).toBe(100);
      expect(newStock.getValue()).toBe(150);
    });

    it('should support value equality semantics', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(100);
      // Different instances but same value should be considered equal
      expect(stock1 === stock2).toBe(false);
      expect(stock1.equals(stock2)).toBe(true);
    });

    it('should work correctly in collections by value', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(100);
      const stock3 = new AvailableStock(50);

      const stocks = [stock1, stock2, stock3];
      const hasSameValue = stocks.some((s) => s.equals(stock1));
      expect(hasSameValue).toBe(true);
    });

    it('should handle multiple instances independently', () => {
      const stock1 = new AvailableStock(100);
      const stock2 = new AvailableStock(200);
      const stock3 = new AvailableStock(100);

      expect(stock1.getValue()).toBe(100);
      expect(stock2.getValue()).toBe(200);
      expect(stock3.getValue()).toBe(100);
      expect(stock1.equals(stock3)).toBe(true);
      expect(stock1.equals(stock2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle float values that are non-negative', () => {
      const stock = new AvailableStock(100.5);
      expect(stock.getValue()).toBe(100.5);
    });

    it('should handle very small positive values', () => {
      const stock = new AvailableStock(0.0001);
      expect(stock.getValue()).toBe(0.0001);
    });

    it('should work with scientific notation numbers', () => {
      const stock = new AvailableStock(1e6);
      expect(stock.getValue()).toBe(1e6);
      expect(stock.getValue()).toBe(1000000);
    });

    it('should distinguish between 0 and small positive value', () => {
      const zeroStock = new AvailableStock(0);
      const smallStock = new AvailableStock(0.0001);
      expect(zeroStock.equals(smallStock)).toBe(false);
    });

    it('should preserve numeric precision', () => {
      const stock = new AvailableStock(123.456789);
      expect(stock.getValue()).toBe(123.456789);
    });
  });
});
