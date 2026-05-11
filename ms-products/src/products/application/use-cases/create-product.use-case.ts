import { Inject, Injectable, Optional } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductCreatedEvent } from '../../domain/events/product-created.event';

import { ProductId } from '../../domain/value-objects/product-id.vo';
import { ProductConfigPort } from '../ports/product.config.port';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type CreateProductDto = {
  correlationId: string;
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
};

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

  async execute(createProductDto: CreateProductDto): Promise<void> {
    this.logger?.verbose('Executing CreateProductUseCase with command:', createProductDto);

    if (!createProductDto) {
      this.logger?.warn('CreateProductCommand executed without data');
      return;
    }

    const productId = new ProductId(createProductDto.id);

    const existingProduct =
      (await this.productRepository.findById(productId)) ||
      (await this.productRepository.findBySku(createProductDto.sku));
    if (existingProduct) {
      this.logger?.warn(
        `Product with ID ${createProductDto.id} or SKU ${createProductDto.sku} already exists.`
      );
      return;
    }

    const newProduct = Product.create(
      createProductDto.id,
      createProductDto.name,
      createProductDto.description,
      createProductDto.price,
      createProductDto.categories,
      createProductDto.sku,
      this.productConfig.defaultCurrency
    );
    const savedProduct = await this.productRepository.save(newProduct);

    const productCreatedEvent = new ProductCreatedEvent(
      createProductDto.correlationId,
      savedProduct
    );

    this.productEventEmitter.emitProductCreated(productCreatedEvent);
    this.logger?.verbose('Product created successfully:', savedProduct);
  }
}
