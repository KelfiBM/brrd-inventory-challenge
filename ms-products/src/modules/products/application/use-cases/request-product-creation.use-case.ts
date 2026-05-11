import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommand } from '../../commands/create-product.command';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type RequestProductCreationDto = {
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
};

@Injectable()
export class RequestProductCreationUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(requestProductCreationDto: RequestProductCreationDto): Promise<ProductId> {
    const existingProduct = await this.productRepository.findBySku(requestProductCreationDto.sku);
    if (existingProduct) {
      throw new Error('Product with the same SKU already exists');
    }
    const nextProductId = await this.productRepository.getNextId();

    const createProductCommand = new CreateProductCommand({
      id: nextProductId.getValue(),
      name: requestProductCreationDto.name,
      description: requestProductCreationDto.description,
      price: requestProductCreationDto.price,
      categories: requestProductCreationDto.categories,
      sku: requestProductCreationDto.sku,
    });
    await this.productEventEmitter.emitCreateProductCommand(createProductCommand);
    return nextProductId;
  }
}
