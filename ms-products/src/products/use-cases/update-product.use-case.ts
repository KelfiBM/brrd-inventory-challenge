import { Inject, Injectable } from '@nestjs/common';
import { UpdateProductCommand } from '../commands/update-product.command';
import { ProductUpdatedEvent } from '../domain-events/product-updated.event';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(updateProductCommand: UpdateProductCommand): Promise<void> {
    const data = updateProductCommand.data;
    if (!data) {
      throw new Error('No product data provided in the command');
    }

    const productId = new ProductId(data.id);
    const existingProduct = await this.productRepository.findById(productId);

    if (!existingProduct) {
      throw new Error(`Product with ID ${productId.getValue()} does not exist.`);
    }

    existingProduct.updateName(data.name || existingProduct.getName());
    existingProduct.updateDescription(data.description || existingProduct.getDescription());
    existingProduct.updatePrice(data.price || existingProduct.getPrice().getValue());
    existingProduct.updateCategories(data.categories || existingProduct.getCategories());

    await this.productRepository.save(existingProduct);

    const productUpdatedEvent = new ProductUpdatedEvent(
      updateProductCommand.metadata.correlationId.getValue(),
      existingProduct
    );

    this.productEventEmitter.emitProductUpdated(productUpdatedEvent);
  }
}
