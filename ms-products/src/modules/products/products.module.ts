import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CacheManagerModule } from '../cache-manager/cache-manager.module';
import { EventStreamingModule } from '../event-streaming/event-streaming.module';
import { CURRENCY_CONVERTER } from './application/ports/currency-converter.port';
import { PRODUCT_CACHE_REPOSITORY } from './application/ports/product.cache-repository.port';
import { PRODUCT_CONFIG } from './application/ports/product.config.port';
import { PRODUCT_EVENT_EMITTER } from './application/ports/product.event-emitter.port';
import { PRODUCT_LOGGER } from './application/ports/product.logger.port';
import { PRODUCT_REPOSITORY } from './application/ports/product.repository.port';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { FindAllProductsUseCase } from './application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from './application/use-cases/find-one-product.use-case';
import { RequestProductCreationUseCase } from './application/use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './application/use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './application/use-cases/request-product-update.use-case';
import { InvalidateCacheUseCase } from './application/use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import productsConfig from './configs/products.config';
import { ExchangeRateApiCurrencyConverter } from './infrastructure/adapters/currency-converter/exchange-rate-api.currency-converter';
import { NestProductCacheRepository } from './infrastructure/adapters/product-cache-repository/nest.product.cache-repository';
import { NestProductConfig } from './infrastructure/adapters/product-config/nest.product.config';
import { NestProductEventEmitter } from './infrastructure/adapters/product-event-emitter/nest.product.event-emitter';
import { NestProductLogger } from './infrastructure/adapters/product-logger/nest.product.logger';
import { ProductSchema } from './infrastructure/adapters/product-repository/type-orm-product-repository/schema/product.schema';
import { TypeOrmProductRepository } from './infrastructure/adapters/product-repository/type-orm-product-repository/type-orm-product.repository';
import { AuthGuard } from './presentation/guards/auth.guard';
import { RolesGuard } from './presentation/guards/role.guard';
import { ProductIdempotencyInterceptor } from './presentation/interceptors/product-idempotency.interceptor';
import { ProductsEventController } from './presentation/products.event.controller';
import { ProductsHttpController } from './presentation/products.http.controller';

const imports = [
  ConfigModule.forFeature(productsConfig),
  HttpModule,
  TypeOrmModule.forFeature([ProductSchema]),
  EventStreamingModule,
  CacheManagerModule,
  AuthModule,
];

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
    useClass: NestProductEventEmitter,
  },
  {
    provide: CURRENCY_CONVERTER,
    useClass: ExchangeRateApiCurrencyConverter,
  },
  {
    provide: PRODUCT_CACHE_REPOSITORY,
    useClass: NestProductCacheRepository,
  },
  {
    provide: PRODUCT_REPOSITORY,
    useClass: TypeOrmProductRepository,
  },
];

const providers = [...useCases, ...adapters, ProductIdempotencyInterceptor, RolesGuard, AuthGuard];

@Module({
  imports: [...imports],
  controllers: [...controllers],
  providers: [...providers],
})
export class ProductsModule {}
