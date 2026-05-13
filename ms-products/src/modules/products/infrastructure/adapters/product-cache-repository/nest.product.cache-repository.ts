import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductCacheRepositoryPort } from '../../../application/ports/product.cache-repository.port';
import { CacheKeys } from '../../../configs/products.consts';
import { ProductDbEntity } from '../product-repository/type-orm-product-repository/entities/product.db-entity';

@Injectable()
export class NestProductCacheRepository implements ProductCacheRepositoryPort {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async findAll(): Promise<ProductDbEntity[]> {
    const value = await this.cacheManager.get<ProductDbEntity[]>(CacheKeys.ALL_PRODUCTS);
    return value || [];
  }
  async saveAll(products: ProductDbEntity[]): Promise<void> {
    await this.cacheManager.set(CacheKeys.ALL_PRODUCTS, products, 0);
  }

  async findByCategory(category: string): Promise<ProductDbEntity[]> {
    const value = await this.cacheManager.get<ProductDbEntity[]>(
      CacheKeys.PRODUCTS_BY_CATEGORY(category)
    );
    return value || [];
  }

  async saveByCategory(category: string, products: ProductDbEntity[]): Promise<void> {
    await this.cacheManager.set(CacheKeys.PRODUCTS_BY_CATEGORY(category), products, 0);
  }

  async findById(id: string): Promise<ProductDbEntity | null> {
    const value = await this.cacheManager.get<ProductDbEntity>(
      CacheKeys.PRODUCT_BY_ID(id)
    );
    return value || null;
  }

  async save(product: ProductDbEntity): Promise<ProductDbEntity> {
    await this.cacheManager.del(CacheKeys.ALL_PRODUCTS);
    const oldProduct = await this.cacheManager.get<ProductDbEntity>(CacheKeys.PRODUCT_BY_ID(product.id));
    if (oldProduct) {
      for (const category of oldProduct.categories) {
        await this.cacheManager.del(CacheKeys.PRODUCTS_BY_CATEGORY(category));
      }
    }
    await this.cacheManager.set(CacheKeys.PRODUCT_BY_ID(product.id), product, 0);
    return product;
  }

  async remove(id: string): Promise<void> {
    await this.cacheManager.del(CacheKeys.ALL_PRODUCTS);
    const oldProduct = await this.cacheManager.get<ProductDbEntity>(CacheKeys.PRODUCT_BY_ID(id));
    if (oldProduct) {
      for (const category of oldProduct.categories) {
        await this.cacheManager.del(CacheKeys.PRODUCTS_BY_CATEGORY(category));
      }
    }
    await this.cacheManager.del(CacheKeys.PRODUCT_BY_ID(id));
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
    await this.cacheManager.set(CacheKeys.EXCHANGE_RATES(forCurrency), rates, 3600 * 1000 * 24);
  }
}
