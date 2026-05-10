import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommand } from '../commands/create-product.command';
import { ProductCreatedEvent } from '../domain-events/product-created.event';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(createProductCommand: CreateProductCommand): Promise<void> {
    const data = createProductCommand.data;
    if (!data) {
      throw new Error('No product data provided in the command');
    }

    const existingProduct =
      (await this.productRepository.findById(data.getId())) ||
      (await this.productRepository.findBySku(data.getSku()));
    if (existingProduct) {
      throw new Error(
        `Product with ID ${data.getId().getValue()} or SKU ${data.getSku()} already exists.`
      );
    }

    await this.productRepository.save(createProductCommand.data);

    const productCreatedEvent = new ProductCreatedEvent(
      createProductCommand.metadata.correlationId.getValue(),
      createProductCommand.data
    );

    this.productEventEmitter.emitProductCreated(productCreatedEvent);
  }
}
