import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { StockCacheRepositoryPort } from '../../../application/ports/stock.cache-repository.port';
import { CacheKeys } from '../../../configs/stocks.consts';
import { StockDbEntity } from '../stock-repository/type-orm-stock-repository/schema/stock.db-entity';

@Injectable()
export class NestStockCacheRepository implements StockCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async setStockByProductId(
    productId: string,
    stock: StockDbEntity,
  ): Promise<StockDbEntity> {
    const key = CacheKeys.STOCK(productId);
    await this.cacheManager.set(key, stock);
    return stock;
  }
  async getStockByProductId(productId: string): Promise<StockDbEntity | null> {
    const value = await this.cacheManager.get<StockDbEntity>(
      CacheKeys.STOCK(productId),
    );
    return value || null;
  }
  async removeStockByProductId(productId: string): Promise<void> {
    const key = CacheKeys.STOCK(productId);
    await this.cacheManager.del(key);
  }
}
