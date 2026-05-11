import { Inject, Injectable, Optional } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../ports/product.cache-repository.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';

type InvalidateCacheDto = {
  product: Product;
};

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

  async execute(invalidateCacheDto: InvalidateCacheDto): Promise<void> {
    if (!this.productCacheRepository) {
      this.logger?.verbose('No cache repository available, skipping cache invalidation.');
      return;
    }
    this.logger?.verbose(
      'Executing InvalidateCacheUseCase with event: {DomainEvent}',
      invalidateCacheDto
    );

    await this.productCacheRepository.remove(invalidateCacheDto.product.getId());
    this.logger?.verbose(
      `Product with ID ${invalidateCacheDto.product.getId().getValue()} removed from cache.`
    );
  }
}
