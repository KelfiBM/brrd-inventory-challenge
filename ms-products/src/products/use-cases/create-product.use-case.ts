import { Inject, Injectable, Optional } from '@nestjs/common';
import { CreateProductCommand } from '../commands/create-product.command';
import { ProductCreatedEvent } from '../domain-events/product-created.event';
import { Product } from '../entities/product.entity';
import { ProductConfigPort } from '../ports/product.config.port';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort,
    @Inject('PRODUCT_CONFIG')
    private readonly productConfig: ProductConfigPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort
  ) {}

  async execute(createProductCommand: CreateProductCommand): Promise<void> {
    this.logger?.verbose('Executing CreateProductUseCase with command:', createProductCommand);
    const data = createProductCommand.data;
    if (!data) {
      this.logger?.warn('CreateProductCommand executed without data');
      return;
    }

    const productId = new ProductId(data.id);

    const existingProduct =
      (await this.productRepository.findById(productId)) ||
      (await this.productRepository.findBySku(data.sku));
    if (existingProduct) {
      this.logger?.warn(`Product with ID ${data.id} or SKU ${data.sku} already exists.`);
      return;
    }

    const newProduct = Product.create(
      data.id,
      data.name,
      data.description,
      data.price,
      data.categories,
      data.sku,
      this.productConfig.defaultCurrency
    );
    const savedProduct = await this.productRepository.save(newProduct);

    const productCreatedEvent = new ProductCreatedEvent(
      createProductCommand.metadata.correlationId.getValue(),
      savedProduct
    );

    this.productEventEmitter.emitProductCreated(productCreatedEvent);
    this.logger?.verbose('Product created successfully:', savedProduct);
  }
}
