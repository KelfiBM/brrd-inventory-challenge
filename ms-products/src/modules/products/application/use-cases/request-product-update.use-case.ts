import { Inject, Injectable } from '@nestjs/common';
import { UpdateProductCommand } from '../../commands/update-product.command';
import { ProductId } from '../../domain/value-objects/product-id.vo';

import { Product } from '../../domain/entities/product.entity';
import { ProductNotChangedError } from '../../domain/errors/product-not-changed.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';

type RequestProductUpdateDto = {
  id: ProductId;
  name?: string;
  description?: string;
  price?: Price;
  categories?: ProductCategory[];
};

@Injectable()
export class RequestProductUpdateUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(requestProductUpdateDto: RequestProductUpdateDto): Promise<ProductId> {
    if (RequestProductUpdateUseCase.areAllFieldsEmpty(requestProductUpdateDto)) {
      throw new ProductNotChangedError('At least one field must be provided for update.');
    }

    const productId = requestProductUpdateDto.id;
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${productId.getValue()} not found.`);
    }

    if (
      !RequestProductUpdateUseCase.isThereAtLeastOneFieldToUpdate(
        requestProductUpdateDto,
        existingProduct
      )
    ) {
      throw new ProductNotChangedError(
        'At least one field must have a different value from the existing product.'
      );
    }

    existingProduct.updateCategories(
      requestProductUpdateDto.categories || existingProduct.getCategories()
    );
    existingProduct.updateDescription(
      requestProductUpdateDto.description || existingProduct.getDescription()
    );
    existingProduct.updateName(requestProductUpdateDto.name || existingProduct.getName());
    existingProduct.updatePrice(requestProductUpdateDto.price || existingProduct.getPrice());

    const updateProductCommand = new UpdateProductCommand({
      id: existingProduct.getId().getValue(),
      name: existingProduct.getName(),
      description: existingProduct.getDescription(),
      price: existingProduct.getPrice().getValue(),
      categories: existingProduct.getCategories().map((category) => category.getValue()),
    });
    await this.productEventEmitter.emitUpdateProductCommand(updateProductCommand);
    return existingProduct.getId();
  }

  private static areAllFieldsEmpty(requestProductUpdateDto: RequestProductUpdateDto): boolean {
    return (
      !requestProductUpdateDto.name &&
      !requestProductUpdateDto.description &&
      !requestProductUpdateDto.price &&
      (!requestProductUpdateDto.categories || requestProductUpdateDto.categories.length === 0)
    );
  }

  private static isThereAtLeastOneFieldToUpdate(
    requestProductUpdateDto: RequestProductUpdateDto,
    existingProduct: Product
  ): boolean {
    return (
      (requestProductUpdateDto.name !== undefined &&
        requestProductUpdateDto.name !== existingProduct.getName()) ||
      (requestProductUpdateDto.description !== undefined &&
        requestProductUpdateDto.description !== existingProduct.getDescription()) ||
      (requestProductUpdateDto.price !== undefined &&
        requestProductUpdateDto.price !== existingProduct.getPrice()) ||
      (requestProductUpdateDto.categories !== undefined &&
        JSON.stringify(requestProductUpdateDto.categories) !==
          JSON.stringify(existingProduct.getCategories()))
    );
  }
}
