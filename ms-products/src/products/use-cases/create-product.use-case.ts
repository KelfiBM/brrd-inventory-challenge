import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommand } from '../commands/create-product.command';
import { ProductCreatedEvent } from '../domain-events/product-created.event';
import { Product } from '../entities/product.entity';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

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

    const productId = new ProductId(data.id);

    const existingProduct =
      (await this.productRepository.findById(productId)) ||
      (await this.productRepository.findBySku(data.sku));
    if (existingProduct) {
      throw new Error(`Product with ID ${data.id} or SKU ${data.sku} already exists.`);
    }

    const newProduct = Product.create(
      data.id,
      data.name,
      data.description,
      data.price,
      data.categories,
      data.sku
    );
    const savedProduct = await this.productRepository.save(newProduct);

    const productCreatedEvent = new ProductCreatedEvent(
      createProductCommand.metadata.correlationId.getValue(),
      savedProduct
    );

    this.productEventEmitter.emitProductCreated(productCreatedEvent);
  }
}
