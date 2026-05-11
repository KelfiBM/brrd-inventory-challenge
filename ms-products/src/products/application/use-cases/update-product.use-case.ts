import { Inject, Injectable, Optional } from '@nestjs/common';
import { ProductUpdatedEvent } from '../../domain-events/product-updated.event';

import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type UpdateProductDto = {
  correlationId: string;
  id: ProductId;
  name?: string;
  description?: string;
  price?: Price;
  categories?: ProductCategory[];
};

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  async execute(updateProductDto: UpdateProductDto): Promise<void> {
    this.logger?.verbose(
      'Executing UpdateProductUseCase with command: {UpdateProductCommand}',
      updateProductDto
    );
    if (!updateProductDto) {
      this.logger?.warn('UpdateProductCommand executed without data');
      return;
    }

    const existingProduct = await this.productRepository.findById(updateProductDto.id);

    if (!existingProduct) {
      this.logger?.warn(`Product with ID ${updateProductDto.id.getValue()} does not exist.`);
      return;
    }

    existingProduct.updateName(updateProductDto.name || existingProduct.getName());
    existingProduct.updateDescription(
      updateProductDto.description || existingProduct.getDescription()
    );
    existingProduct.updatePrice(updateProductDto.price || existingProduct.getPrice());
    existingProduct.updateCategories(
      updateProductDto.categories || existingProduct.getCategories()
    );

    await this.productRepository.save(existingProduct);

    const productUpdatedEvent = new ProductUpdatedEvent(
      updateProductDto.correlationId,
      existingProduct
    );

    this.productEventEmitter.emitProductUpdated(productUpdatedEvent);
    this.logger?.log(`Product with ID ${updateProductDto.id.getValue()} updated successfully.`);
  }
}
