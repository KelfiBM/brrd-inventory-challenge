import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommand } from '../commands/create-product.command';
import { CreateProductRequestDto } from '../dtos/create-product.request.dto';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

@Injectable()
export class RequestProductCreationUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(createProductRequestDto: CreateProductRequestDto): Promise<ProductId> {
    const existingProduct = await this.productRepository.findBySku(createProductRequestDto.sku);
    if (existingProduct) {
      throw new Error('Product with the same SKU already exists');
    }
    const nextProductId = await this.productRepository.getNextId();

    const createProductCommand = new CreateProductCommand({
      id: nextProductId.getValue(),
      name: createProductRequestDto.name,
      description: createProductRequestDto.description,
      price: createProductRequestDto.price,
      categories: createProductRequestDto.categories,
      sku: createProductRequestDto.sku,
    });
    await this.productEventEmitter.emitCreateProductCommand(createProductCommand);
    return nextProductId;
  }
}
