import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ProductConfigPort } from '../../../application/ports/product.config.port';
import productsConfig from '../../../products.config';

@Injectable()
export class NestProductConfig implements ProductConfigPort {
  constructor(
    @Inject(productsConfig.KEY)
    private readonly productConfig: ConfigType<typeof productsConfig>
  ) {}
  kafkaBroker(): string {
    return this.productConfig.kafkaBroker;
  }
  kafkaConsumerGroup(): string {
    return this.productConfig.kafkaConsumerGroup;
  }
  exchangeRateApiUrl(): string {
    return this.productConfig.exchangeRateApiUrl;
  }
  exchangeRateApiKey(): string {
    return this.productConfig.exchangeRateApiKey;
  }
  defaultCurrency(): string {
    return this.productConfig.defaultCurrency;
  }
}
