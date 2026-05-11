import { Inject, Injectable } from '@nestjs/common';
import { DeleteProductCommand } from '../../commands/delete-product.command';
import { ProductId } from '../../domain/value-objects/product-id.vo';

import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type RequestProductDeletionDto = {
  id: ProductId;
};

@Injectable()
export class RequestProductDeletionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(requestProductDeletionDto: RequestProductDeletionDto): Promise<ProductId> {
    const productId = requestProductDeletionDto.id;
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error(`Product with ID ${productId.getValue()} not found.`);
    }

    const deleteProductCommand = new DeleteProductCommand({
      id: existingProduct.getId().getValue(),
    });
    await this.productEventEmitter.emitDeleteProductCommand(deleteProductCommand);
    return existingProduct.getId();
  }
}
