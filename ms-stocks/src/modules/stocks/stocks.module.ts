import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CacheManagerModule } from '../cache-manager/cache-manager.module';
import { EventStreamingModule } from '../event-streaming/event-streaming.module';
import { STOCK_CACHE_REPOSITORY } from './application/ports/stock.cache-repository.port';
import { STOCK_EVENT_EMITTER } from './application/ports/stock.event-emitter.port';
import { STOCK_LOGGER } from './application/ports/stock.logger.port';
import { STOCK_REPOSITORY } from './application/ports/stock.repository.port';
import { CreateStockMovementUseCase } from './application/use-cases/create-stock-movement.use-case';
import { CreateStockUseCase } from './application/use-cases/create-stock.use-case';
import { DeleteStockUseCase } from './application/use-cases/delete-stock.use-case';
import { FindOneStockUseCase } from './application/use-cases/find-one-stock.use-case';
import { RequestStockMovementCreationUseCase } from './application/use-cases/request-stock-movement-creation.use-case';
import { UpdateStockUseCase } from './application/use-cases/update-stock.use-case';
import { NestStockCacheRepository } from './infrastructure/adapters/stock-cache-repository/nest.stock.cache-repository';
import { NestStockEventEmitter } from './infrastructure/adapters/stock-event-emitter/nest.stock.event-emitter';
import { NestStockLogger } from './infrastructure/adapters/stock-logger/nest.stock.logger';
import { StockDbEntity } from './infrastructure/adapters/stock-repository/type-orm-stock-repository/db-entities/stock.db-entity';
import { TypeOrmStockRepository } from './infrastructure/adapters/stock-repository/type-orm-stock-repository/type-orm-stock.repository';
import { AuthGuard } from './presentation/guards/auth.guard';
import { RolesGuard } from './presentation/guards/role.guard';
import { HttpResponseInterceptor } from './presentation/interceptors/http-response.interceptor';
import { StockIdempotencyInterceptor } from './presentation/interceptors/stock-idempotency.interceptor';
import { StocksEventController } from './presentation/stocks.event.controller';
import { StocksHttpController } from './presentation/stocks.http.controller';

const imports = [
  TypeOrmModule.forFeature([StockDbEntity]),
  EventStreamingModule,
  CacheManagerModule,
  AuthModule,
];

const controllers = [StocksEventController, StocksHttpController];

const useCases = [
  CreateStockUseCase,
  DeleteStockUseCase,
  UpdateStockUseCase,
  FindOneStockUseCase,
  CreateStockMovementUseCase,
  RequestStockMovementCreationUseCase,
];

const adapters = [
  {
    provide: STOCK_LOGGER,
    useClass: NestStockLogger,
  },
  {
    provide: STOCK_EVENT_EMITTER,
    useClass: NestStockEventEmitter,
  },
  {
    provide: STOCK_CACHE_REPOSITORY,
    useClass: NestStockCacheRepository,
  },
  {
    provide: STOCK_REPOSITORY,
    useClass: TypeOrmStockRepository,
  },
];

const providers = [
  ...useCases,
  ...adapters,
  StockIdempotencyInterceptor,
  HttpResponseInterceptor,
  RolesGuard,
  AuthGuard,
];

@Module({
  imports: [...imports],
  controllers: [...controllers],
  providers: [...providers],
})
export class StocksModule {}
