import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { StockCacheRepositoryPort } from '../../../application/ports/stock.cache-repository.port';
import { CacheKeys } from '../../../configs/stocks.consts';
import { Stock } from '../../../domain/entities/stock.entity';
import { ProductId } from '../../../domain/value-objects/product-id.vo';

@Injectable()
export class NestStockCacheRepository implements StockCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async getStockByProductId(productId: ProductId): Promise<Stock | null> {
    const value = await this.cacheManager.get<Stock>(
      CacheKeys.STOCK(productId.getValue()),
    );
    return value || null;
  }
  async removeStockByProductId(productId: ProductId): Promise<void> {
    const key = CacheKeys.STOCK(productId.getValue());
    await this.cacheManager.del(key);
  }
}
