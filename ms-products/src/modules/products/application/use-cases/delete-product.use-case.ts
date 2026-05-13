import { Inject, Injectable, Optional } from '@nestjs/common';
import { ProductChangedEvent } from '../../domain/events/product-changed.event';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type DeleteProductDto = {
  correlationId: string;
  id: ProductId;
};

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

  async execute(deleteProductDto: DeleteProductDto): Promise<void> {
    this.logger?.verbose(
      'Executing DeleteProductUseCase with command: {DeleteProductCommand}',
      deleteProductDto
    );
    if (!deleteProductDto) {
      this.logger?.warn('DeleteProductCommand executed without data');
      return;
    }

    const existingProduct = await this.productRepository.findById(deleteProductDto.id);

    if (!existingProduct) {
      this.logger?.warn(`Product with ID ${deleteProductDto.id.getValue()} does not exist.`);
      return;
    }

    await this.productRepository.remove(deleteProductDto.id);

    const productDeletedEvent = new ProductChangedEvent(
      deleteProductDto.correlationId,
      existingProduct
    );

    this.productEventEmitter.emitProductDeleted(productDeletedEvent);
    this.logger?.log(`Product with ID ${deleteProductDto.id.getValue()} deleted successfully.`);
  }
}
