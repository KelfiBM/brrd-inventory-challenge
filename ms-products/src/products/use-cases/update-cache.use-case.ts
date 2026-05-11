import { Inject, Injectable, Optional } from '@nestjs/common';
import { DomainEvent } from '../domain-events/domain-event';
import { Product } from '../entities/product.entity';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../ports/product.cache-repository.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';

@Injectable()
export class UpdateCacheUseCase {
  constructor(
    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly productCacheRepository: ProductCacheRepositoryPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  async execute(domainEvent: DomainEvent<Product>): Promise<void> {
    this.logger?.verbose('Executing UpdateCacheUseCase with event: {DomainEvent}', domainEvent);
    const product = domainEvent.data;
    await this.productCacheRepository.remove(product.getId());
    this.logger?.log(`Product with ID ${product.getId().getValue()} removed from cache.`);
  }
}
