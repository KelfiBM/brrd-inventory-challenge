import KeyvRedis from '@keyv/redis';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CURRENCY_CONVERTER } from './application/ports/currency-converter.port';
import { PRODUCT_CACHE_REPOSITORY } from './application/ports/product.cache-repository.port';
import { PRODUCT_CONFIG, ProductConfigPort } from './application/ports/product.config.port';
import { PRODUCT_EVENT_EMITTER } from './application/ports/product.event-emitter.port';
import { PRODUCT_LOGGER } from './application/ports/product.logger.port';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { FindAllProductsUseCase } from './application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from './application/use-cases/find-one-product.use-case';
import { RequestProductCreationUseCase } from './application/use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './application/use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './application/use-cases/request-product-update.use-case';
import { InvalidateCacheUseCase } from './application/use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ExchangeRateApiCurrencyConverter } from './infrastructure/adapters/currency-converter/exchange-rate-api.currency-converter';
import { NestProductCacheRepository } from './infrastructure/adapters/product-cache-repository/redis-product.cache-repository';
import { NestProductConfig } from './infrastructure/adapters/product-config/nest-product.config';
import {
  KAFKA_PRODUCT_EVENT_EMITTER,
  KafkaProductEventEmitter,
} from './infrastructure/adapters/product-event-emitter/kafka-product.event-emitter';
import { NestProductLogger } from './infrastructure/adapters/product-logger/nest-product.logger';
import { ProductsEventController } from './presentation/products.event.controller';
import { ProductsHttpController } from './presentation/products.http.controller';
import productsConfig from './products.config';

const controllers = [ProductsHttpController, ProductsEventController];
const useCases = [
  RequestProductCreationUseCase,
  RequestProductUpdateUseCase,
  RequestProductDeletionUseCase,
  CreateProductUseCase,
  DeleteProductUseCase,
  UpdateProductUseCase,
  InvalidateCacheUseCase,
  FindAllProductsUseCase,
  FindOneProductUseCase,
];

const adapters = [
  {
    provide: PRODUCT_LOGGER,
    useClass: NestProductLogger,
  },
  {
    provide: PRODUCT_CONFIG,
    useClass: NestProductConfig,
  },
  {
    provide: PRODUCT_EVENT_EMITTER,
    useClass: KafkaProductEventEmitter,
  },
  {
    provide: CURRENCY_CONVERTER,
    useClass: ExchangeRateApiCurrencyConverter,
  },
  {
    provide: PRODUCT_CACHE_REPOSITORY,
    useClass: NestProductCacheRepository,
  },
];

const imports = [
  ConfigModule.forFeature(productsConfig),
  HttpModule,
  ClientsModule.registerAsync([
    {
      inject: [PRODUCT_CONFIG],
      name: KAFKA_PRODUCT_EVENT_EMITTER,
      useFactory: async (config: ProductConfigPort) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            id: 'products',
            brokers: [config.kafkaBroker()],
          },
          consumer: {
            groupId: config.kafkaConsumerGroup(),
          },
        },
      }),
    },
  ]),
  CacheModule.registerAsync({
    inject: [PRODUCT_CONFIG],
    useFactory: async (config: ProductConfigPort) => {
      return {
        stores: [new KeyvRedis(config.redisUrl())],
        ttl: 3600, // 1 hour default TTL
      };
    },
  }),
];

@Module({
  imports: [...imports],
  controllers: [...controllers],
  providers: [...useCases, ...adapters],
})
export class ProductsModule {}
