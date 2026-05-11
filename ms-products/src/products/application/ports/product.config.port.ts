export interface ProductConfigPort {
  defaultCurrency(): string;
  exchangeRateApiUrl(): string;
  exchangeRateApiKey(): string;
  kafkaBroker(): string;
  kafkaConsumerGroup(): string;
}

export const PRODUCT_CONFIG = Symbol('PRODUCT_CONFIG');
