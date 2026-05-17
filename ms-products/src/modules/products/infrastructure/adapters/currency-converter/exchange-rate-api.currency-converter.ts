import { HttpService } from '@nestjs/axios';
import { Inject, Optional } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { CurrencyConverterPort } from '../../../application/ports/currency-converter.port';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../../../application/ports/product.cache-repository.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../../../application/ports/product.logger.port';
import productsConfig from '../../../configs/products.config';
import { Currency } from '../../../domain/value-objects/currency.vo';

type ExchangeRateApiResponse = {
  base_code: string;
  conversion_rates: Record<string, number>;
};

export class ExchangeRateApiCurrencyConverter implements CurrencyConverterPort {
  constructor(
    @Inject(productsConfig.KEY) private readonly productConfig: ConfigType<typeof productsConfig>,
    private readonly httpService: HttpService,

    @Optional()
    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly cacheRepository?: ProductCacheRepositoryPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  private buildExchangeRateApiUrl(baseCurrency: string): string {
    return `${this.productConfig.exchangeRateApiUrl}/${this.productConfig.exchangeRateApiKey}/latest/${baseCurrency}`;
  }

  private async getExchangeRateTable(forCurrency: string): Promise<Record<string, number>> {
    if (this.cacheRepository) {
      const cachedRates = await this.cacheRepository.getExchangeRateTable(forCurrency);
      if (cachedRates && Object.keys(cachedRates).length > 0) {
        return cachedRates;
      }
    }

    const { data } = await firstValueFrom(
      this.httpService.get<ExchangeRateApiResponse>(this.buildExchangeRateApiUrl(forCurrency)).pipe(
        catchError((error) => {
          this.logger?.error('Failed to fetch exchange rates from API', error);
          throw error;
        })
      )
    );    

    if (this.cacheRepository) {
      try {
        await this.cacheRepository.saveExchangeRateTable(forCurrency, data.conversion_rates);
      } catch (error) {
        this.logger?.error('Failed to save exchange rates to cache', error);
      }
    }
    return data.conversion_rates;
  }

  async convert(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    const fromCurrencyValue = fromCurrency.getValue();
    const toCurrencyValue = toCurrency.getValue();
    const exchangeRates = await this.getExchangeRateTable(fromCurrencyValue);
    const rate = exchangeRates[toCurrencyValue];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrencyValue} to ${toCurrencyValue}`);
    }
    return amount * rate;
  }
}
