import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductCacheRepositoryPort } from '../../../application/ports/product.cache-repository.port';
import { CacheKeys } from '../../../configs/products.consts';
import { ProductId } from '../../../domain/value-objects/product-id.vo';
import { ProductDbEntity } from '../product-repository/type-orm-product-repository/schema/product.db-entity';

@Injectable()
export class NestProductCacheRepository implements ProductCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async findAll(): Promise<ProductDbEntity[]> {
    const value = await this.cacheManager.get<ProductDbEntity[]>(CacheKeys.ALL_PRODUCTS);
    return value || [];
  }
  async saveAll(products: ProductDbEntity[]): Promise<void> {
    await this.cacheManager.set(CacheKeys.ALL_PRODUCTS, products);
  }

  async delAll(): Promise<void> {
    await this.cacheManager.del(CacheKeys.ALL_PRODUCTS);
  }

  async findByCategory(category: string): Promise<ProductDbEntity[]> {
    const value = await this.cacheManager.get<ProductDbEntity[]>(
      CacheKeys.PRODUCTS_BY_CATEGORY(category)
    );
    return value || [];
  }

  async saveByCategory(category: string, products: ProductDbEntity[]): Promise<void> {
    await this.cacheManager.set(CacheKeys.PRODUCTS_BY_CATEGORY(category), products);
  }

  async delByCategory(): Promise<void> {
    await this.cacheManager.del(CacheKeys.PRODUCTS_BY_CATEGORY('*')); // Invalidate all category caches
  }

  async findById(id: ProductId): Promise<ProductDbEntity | null> {
    const value = await this.cacheManager.get<ProductDbEntity>(
      CacheKeys.PRODUCT_BY_ID(id.getValue())
    );
    return value || null;
  }

  async save(product: ProductDbEntity): Promise<ProductDbEntity> {
    await this.cacheManager.set(CacheKeys.PRODUCT_BY_ID(product.id), product);
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
