import { Inject, Injectable, Optional } from '@nestjs/common';
import { DeleteProductCommand } from '../commands/delete-product.command';
import { ProductDeletedEvent } from '../domain-events/product-deleted.event';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  async execute(deleteProductCommand: DeleteProductCommand): Promise<void> {
    this.logger?.verbose(
      'Executing DeleteProductUseCase with command: {DeleteProductCommand}',
      deleteProductCommand
    );
    const data = deleteProductCommand.data;
    if (!data) {
      this.logger?.warn('DeleteProductCommand executed without data');
      return;
    }

    const productId = new ProductId(data.id);
    const existingProduct = await this.productRepository.findById(productId);

    if (!existingProduct) {
      this.logger?.warn(`Product with ID ${productId.getValue()} does not exist.`);
      return;
    }

    await this.productRepository.remove(productId);

    const productDeletedEvent = new ProductDeletedEvent(
      deleteProductCommand.metadata.correlationId.getValue(),
      existingProduct
    );

    this.productEventEmitter.emitProductDeleted(productDeletedEvent);
    this.logger?.log(`Product with ID ${productId.getValue()} deleted successfully.`);
  }
}
