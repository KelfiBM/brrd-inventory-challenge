import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import productsConfig from '../../../configs/products.config';
import { NestProductConfig } from './nest.product.config';

describe('NestProductConfig', () => {
  let adapter: NestProductConfig;

  beforeEach(async () => {
    const mockConfig: ConfigType<typeof productsConfig> = {
      exchangeRateApiUrl: 'https://api.example.com',
      exchangeRateApiKey: 'test-key-123',
      defaultCurrency: 'DOP',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestProductConfig,
        {
          provide: productsConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    adapter = module.get<NestProductConfig>(NestProductConfig);
  });

  describe('exchangeRateApiUrl', () => {
    it('should return exchange rate API URL', () => {
      const url = adapter.exchangeRateApiUrl();

      expect(url).toBe('https://api.example.com');
    });
  });

  describe('exchangeRateApiKey', () => {
    it('should return exchange rate API key', () => {
      const key = adapter.exchangeRateApiKey();

      expect(key).toBe('test-key-123');
    });
  });

  describe('defaultCurrency', () => {
    it('should return default currency', () => {
      const currency = adapter.defaultCurrency();

      expect(currency).toBe('DOP');
    });

    it('should always return the same currency value', () => {
      const currency1 = adapter.defaultCurrency();
      const currency2 = adapter.defaultCurrency();

      expect(currency1).toBe(currency2);
      expect(currency1).toBe('DOP');
    });
  });

  describe('configuration values consistency', () => {
    it('should provide consistent configuration across calls', () => {
      const url1 = adapter.exchangeRateApiUrl();
      const url2 = adapter.exchangeRateApiUrl();
      const key1 = adapter.exchangeRateApiKey();
      const key2 = adapter.exchangeRateApiKey();
      const currency1 = adapter.defaultCurrency();
      const currency2 = adapter.defaultCurrency();

      expect(url1).toBe(url2);
      expect(key1).toBe(key2);
      expect(currency1).toBe(currency2);
    });
  });

  describe('API configuration values', () => {
    it('should return non-empty API URL', () => {
      const url = adapter.exchangeRateApiUrl();

      expect(url).toBeTruthy();
      expect(url.length).toBeGreaterThan(0);
    });

    it('should return non-empty API key', () => {
      const key = adapter.exchangeRateApiKey();

      expect(key).toBeTruthy();
      expect(key.length).toBeGreaterThan(0);
    });

    it('should return API URL with valid format', () => {
      const url = adapter.exchangeRateApiUrl();

      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('default currency validation', () => {
    it('should return valid 3-letter currency code', () => {
      const currency = adapter.defaultCurrency();

      // ISO 4217 currency codes are 3 letters
      expect(currency).toMatch(/^[A-Z]{3}$/);
    });
  });
});
