import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductCacheRepositoryPort } from '../../../application/ports/product.cache-repository.port';
import { CacheKeys } from '../../../configs/products.consts';
import { Product } from '../../../domain/entities/product.entity';
import { ProductId } from '../../../domain/value-objects/product-id.vo';

@Injectable()
export class NestProductCacheRepository implements ProductCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async findAll(): Promise<Product[]> {
    const value = await this.cacheManager.get<Product[]>(CacheKeys.ALL_PRODUCTS);
    return value || [];
  }
  async findByCategory(category: string): Promise<Product[]> {
    const value = await this.cacheManager.get<Product[]>(CacheKeys.PRODUCTS_BY_CATEGORY(category));
    return value || [];
  }
  async findById(id: ProductId): Promise<Product | null> {
    const value = await this.cacheManager.get<Product>(CacheKeys.PRODUCT_BY_ID(id.getValue()));
    return value || null;
  }
  async save(product: Product): Promise<Product> {
    await this.cacheManager.set(CacheKeys.PRODUCT_BY_ID(product.getId().getValue()), product);
    return product;
  }
  async remove(id: ProductId): Promise<void> {
    await this.cacheManager.del(CacheKeys.ALL_PRODUCTS);
    await this.cacheManager.del(CacheKeys.PRODUCT_BY_ID(id.getValue()));
    await this.cacheManager.del(CacheKeys.PRODUCTS_BY_CATEGORY('*')); // Invalidate all category caches
  }
  async getExchangeRateTable(forCurrency: string): Promise<{ [currency: string]: number }> {
    const value = await this.cacheManager.get<{ [currency: string]: number }>(
      CacheKeys.EXCHANGE_RATES(forCurrency)
    );
    return value || {};
  }
  async saveExchangeRateTable(
    forCurrency: string,
    rates: { [currency: string]: number }
  ): Promise<void> {
    await this.cacheManager.set(CacheKeys.EXCHANGE_RATES(forCurrency), rates);
  }
}
