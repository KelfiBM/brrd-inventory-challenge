import { Inject, Injectable, Optional } from '@nestjs/common';
import { DomainEvent } from '../domain-events/domain-event';
import { Product } from '../entities/product.entity';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../ports/product.cache-repository.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';

@Injectable()
export class InvalidateCacheUseCase {
  constructor(
    @Optional()
    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly productCacheRepository?: ProductCacheRepositoryPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  async execute(domainEvent: DomainEvent<Product>): Promise<void> {
    if (!this.productCacheRepository) {
      this.logger?.verbose('No cache repository available, skipping cache invalidation.');
      return;
    }
    this.logger?.verbose('Executing InvalidateCacheUseCase with event: {DomainEvent}', domainEvent);
    const product = domainEvent.data;
    await this.productCacheRepository.remove(product.getId());
    this.logger?.verbose(`Product with ID ${product.getId().getValue()} removed from cache.`);
  }
}
