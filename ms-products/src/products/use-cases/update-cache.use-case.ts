import { Inject, Injectable } from '@nestjs/common';
import { DomainEvent } from '../domain-events/domain-event';
import { Product } from '../entities/product.entity';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../ports/product.cache-repository.port';

@Injectable()
export class UpdateCacheUseCase {
  constructor(
    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly productCacheRepository: ProductCacheRepositoryPort
  ) {}

  async execute(domainEvent: DomainEvent<Product>): Promise<void> {
    const product = domainEvent.data;
    this.productCacheRepository.remove(product.getId());
  }
}
