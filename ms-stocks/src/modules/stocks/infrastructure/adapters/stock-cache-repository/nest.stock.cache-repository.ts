import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { StockCacheRepositoryPort } from '../../../application/ports/stock.cache-repository.port';
import { CacheKeys } from '../../../configs/stocks.consts';
import { StockDbEntity } from '../stock-repository/type-orm-stock-repository/db-entities/stock.db-entity';

@Injectable()
export class NestStockCacheRepository implements StockCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async save(stock: StockDbEntity): Promise<StockDbEntity> {
    await this.cacheManager.set(CacheKeys.STOCK(stock.productId), stock, 0);
    return stock;
  }
  async findById(productId: string): Promise<StockDbEntity | null> {
    const value = await this.cacheManager.get<StockDbEntity>(
      CacheKeys.STOCK(productId),
    );
    return value || null;
  }
  async remove(productId: string): Promise<void> {
    await this.cacheManager.del(CacheKeys.STOCK(productId));
  }
}
