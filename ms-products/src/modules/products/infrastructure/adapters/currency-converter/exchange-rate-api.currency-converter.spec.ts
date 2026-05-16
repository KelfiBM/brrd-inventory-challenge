import { HttpService } from '@nestjs/axios';
import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../../../application/ports/product.cache-repository.port';
import { PRODUCT_LOGGER } from '../../../application/ports/product.logger.port';
import productsConfig from '../../../configs/products.config';
import { Currency } from '../../../domain/value-objects/currency.vo';
import { ExchangeRateApiCurrencyConverter } from './exchange-rate-api.currency-converter';

describe('ExchangeRateApiCurrencyConverter', () => {
  let converter: ExchangeRateApiCurrencyConverter;
  let httpService: HttpService;
  let cacheRepository: ProductCacheRepositoryPort;

  const mockConfig: ConfigType<typeof productsConfig> = {
    exchangeRateApiUrl: 'https://api.example.com',
    exchangeRateApiKey: 'test-key',
    defaultCurrency: 'DOP',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateApiCurrencyConverter,
        {
          provide: productsConfig.KEY,
          useValue: mockConfig,
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PRODUCT_CACHE_REPOSITORY,
          useValue: {
            getExchangeRateTable: jest.fn(),
            saveExchangeRateTable: jest.fn(),
          },
        },
        {
          provide: PRODUCT_LOGGER,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    converter = module.get<ExchangeRateApiCurrencyConverter>(ExchangeRateApiCurrencyConverter);
    httpService = module.get<HttpService>(HttpService);
    cacheRepository = module.get<ProductCacheRepositoryPort>(PRODUCT_CACHE_REPOSITORY);
  });

  describe('convert', () => {
    it('should convert amount from one currency to another', async () => {
      const mockRates = { DOP: 54.5 };
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(mockRates);

      const result = await converter.convert(100, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(5450); // 100 * 54.5
    });

    it('should use cached rates if available', async () => {
      const mockRates = { EUR: 0.85 };
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(mockRates);
      jest.spyOn(httpService, 'get').mockReturnValue(of({} as any));

      const result = await converter.convert(100, new Currency('USD'), new Currency('EUR'));

      expect(result).toBe(85); // 100 * 0.85
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch from API and cache rates if not in cache', async () => {
      const mockRates = { DOP: 54.5 };
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(null as any);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: { base_code: 'USD', conversion_rates: mockRates } } as any));
      jest.spyOn(cacheRepository, 'saveExchangeRateTable').mockResolvedValue(undefined);

      const result = await converter.convert(100, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(5450);
      expect(cacheRepository.saveExchangeRateTable).toHaveBeenCalledWith('USD', mockRates);
    });

    it('should throw error when exchange rate not found', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(null as any);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          of({ data: { base_code: 'USD', conversion_rates: { EUR: 0.85 } } } as any)
        );

      await expect(
        converter.convert(100, new Currency('USD'), new Currency('DOP'))
      ).rejects.toThrow();
    });
  });

  describe('buildExchangeRateApiUrl', () => {
    it('should build correct API URL', () => {
      const url = (converter as any)['buildExchangeRateApiUrl']('USD');

      expect(url).toBe('https://api.example.com/test-key/latest/USD');
    });

    it('should include currency code in URL', () => {
      const url = (converter as any)['buildExchangeRateApiUrl']('EUR');

      expect(url).toContain('EUR');
    });

    it('should include API key in URL', () => {
      const url = (converter as any)['buildExchangeRateApiUrl']('GBP');

      expect(url).toContain('test-key');
    });

    it('should use correct base URL from config', () => {
      const url = (converter as any)['buildExchangeRateApiUrl']('JPY');

      expect(url).toContain('https://api.example.com');
    });
  });

  describe('convert error scenarios', () => {
    it('should throw error when exchange rate not found for target currency', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(null as any);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          of({ data: { base_code: 'USD', conversion_rates: { EUR: 0.85 } } } as any)
        );

      await expect(
        converter.convert(100, new Currency('USD'), new Currency('GBP'))
      ).rejects.toThrow('Exchange rate not found for USD to GBP');
    });

    it('should handle API error gracefully', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(null as any);
      jest.spyOn(httpService, 'get').mockReturnValue(
        new (require('rxjs').Observable)((subscriber: any) => {
          subscriber.error(new Error('API Error'));
        })
      );

      await expect(
        converter.convert(100, new Currency('USD'), new Currency('EUR'))
      ).rejects.toThrow('API Error');
    });

    it('should not cache if saveExchangeRateTable throws', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(null as any);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          of({ data: { base_code: 'USD', conversion_rates: { DOP: 54.5 } } } as any)
        );
      jest
        .spyOn(cacheRepository, 'saveExchangeRateTable')
        .mockRejectedValue(new Error('Cache error'));

      const result = await converter.convert(100, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(5450);
    });
  });

  describe('convert with different amounts', () => {
    it('should convert zero amount', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue({ DOP: 54.5 });

      const result = await converter.convert(0, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(0);
    });

    it('should convert decimal amounts', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue({ DOP: 100 });

      const result = await converter.convert(10.5, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(1050);
    });

    it('should convert large amounts', async () => {
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue({ DOP: 54.5 });

      const result = await converter.convert(1000000, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(54500000);
    });
  });

  describe('convert with multiple currency pairs', () => {
    it('should convert USD to multiple currencies', async () => {
      const mockRates = { EUR: 0.85, GBP: 0.73, JPY: 110.5 };
      jest.spyOn(cacheRepository, 'getExchangeRateTable').mockResolvedValue(mockRates);

      const usd2Eur = await converter.convert(100, new Currency('USD'), new Currency('EUR'));
      const usd2Gbp = await converter.convert(100, new Currency('USD'), new Currency('GBP'));

      expect(usd2Eur).toBe(85);
      expect(usd2Gbp).toBe(73);
    });
  });

  describe('converter without cache repository', () => {
    it('should work without cache repository provided', async () => {
      const converterNoCache = new ExchangeRateApiCurrencyConverter(
        mockConfig,
        httpService,
        undefined
      );

      const mockRates = { DOP: 54.5 };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of({ data: { base_code: 'USD', conversion_rates: mockRates } } as any));

      const result = await converterNoCache.convert(100, new Currency('USD'), new Currency('DOP'));

      expect(result).toBe(5450);
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
