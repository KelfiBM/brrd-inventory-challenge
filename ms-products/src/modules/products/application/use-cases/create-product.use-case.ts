import { Inject, Injectable, Optional } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductCreatedEvent } from '../../domain/events/product-created.event';

import { CorrelationId } from '../../domain/value-objects/correlation-id.vo';
import { Currency } from '../../domain/value-objects/currency.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { PRODUCT_CONFIG, ProductConfigPort } from '../ports/product.config.port';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type CreateProductDto = {
  correlationId: CorrelationId;
  id: ProductId;
  name: string;
  description: string;
  price: Price;
  categories: ProductCategory[];
  sku: string;
};

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort,
    @Inject(PRODUCT_CONFIG)
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

    const existingProduct =
      (await this.productRepository.findById(createProductDto.id)) ||
      (await this.productRepository.findBySku(createProductDto.sku));
    if (existingProduct) {
      this.logger?.warn(
        `Product with ID ${createProductDto.id.getValue()} or SKU ${createProductDto.sku} already exists.`
      );
      return;
    }

    const defaultCurrency = new Currency(this.productConfig.defaultCurrency());

    const newProduct = Product.create({
      id: createProductDto.id,
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      categories: createProductDto.categories,
      sku: createProductDto.sku,
      currency: defaultCurrency,
    });
    const savedProduct = await this.productRepository.save(newProduct);

    const productCreatedEvent = new ProductCreatedEvent(
      createProductDto.correlationId.getValue(),
      savedProduct
    );

    this.productEventEmitter.emitProductCreated(productCreatedEvent);
    this.logger?.verbose('Product created successfully:', savedProduct);
  }
}
