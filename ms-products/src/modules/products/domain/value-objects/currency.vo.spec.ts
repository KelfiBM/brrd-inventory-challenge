import { Currency } from './currency.vo';

describe('Currency', () => {
  describe('constructor', () => {
    it('should create a valid currency with a 3-letter code', () => {
      const currency = new Currency('USD');
      expect(currency.getValue()).toBe('USD');
    });

    it('should throw error when currency is empty', () => {
      expect(() => new Currency('')).toThrow('Currency cannot be empty');
    });

    it('should throw error when currency code is not 3 letters', () => {
      expect(() => new Currency('US')).toThrow(
        'Currency must be a 3-letter code. ISO 4217 format required'
      );
    });

    it('should throw error when currency code exceeds 3 letters', () => {
      expect(() => new Currency('USDA')).toThrow(
        'Currency must be a 3-letter code. ISO 4217 format required'
      );
    });

    it('should accept lowercase currency codes', () => {
      const currency = new Currency('eur');
      expect(currency.getValue()).toBe('eur');
    });
  });

  describe('equals', () => {
    it('should return true when currencies have the same value', () => {
      const currency1 = new Currency('USD');
      const currency2 = new Currency('USD');
      expect(currency1.equals(currency2)).toBe(true);
    });

    it('should return false when currencies have different values', () => {
      const currency1 = new Currency('USD');
      const currency2 = new Currency('EUR');
      expect(currency1.equals(currency2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const currency1 = new Currency('USD');
      const currency2 = new Currency('usd');
      expect(currency1.equals(currency2)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the currency value', () => {
      const currency = new Currency('DOP');
      expect(currency.getValue()).toBe('DOP');
    });
  });
});
