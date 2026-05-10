import { Inject, Injectable } from '@nestjs/common';
import { UpdateProductCommand } from '../commands/update-product.command';
import { UpdateProductRequestDto } from '../dtos/update-product.request.dto';
import { Product } from '../entities/product.entity';
import {
  PRODUCT_EVENT_EMITTER,
  ProductEventEmitterPort,
} from '../ports/product.event-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { ProductId } from '../value-objects/product-id.vo';

@Injectable()
export class RequestProductUpdateUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_EVENT_EMITTER)
    private readonly productEventEmitter: ProductEventEmitterPort
  ) {}

  async execute(id: string, updateProductRequestDto: UpdateProductRequestDto): Promise<ProductId> {
    if (RequestProductUpdateUseCase.areAllFieldsEmpty(updateProductRequestDto)) {
      throw new Error('At least one field must be provided for update.');
    }

    const productId = new ProductId(id);
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    if (
      !RequestProductUpdateUseCase.isThereAtLeastOneFieldToUpdate(
        updateProductRequestDto,
        existingProduct
      )
    ) {
      throw new Error('At least one field must have a different value from the existing product.');
    }

    existingProduct.updateCategories(
      updateProductRequestDto.categories || existingProduct.getCategories()
    );
    existingProduct.updateDescription(
      updateProductRequestDto.description || existingProduct.getDescription()
    );
    existingProduct.updateName(updateProductRequestDto.name || existingProduct.getName());
    existingProduct.updatePrice(
      updateProductRequestDto.price || existingProduct.getPrice().getValue()
    );

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

  private static areAllFieldsEmpty(updateProductRequestDto: UpdateProductRequestDto): boolean {
    return (
      !updateProductRequestDto.name &&
      !updateProductRequestDto.description &&
      !updateProductRequestDto.price &&
      (!updateProductRequestDto.categories || updateProductRequestDto.categories.length === 0)
    );
  }

  private static isThereAtLeastOneFieldToUpdate(
    updateProductRequestDto: UpdateProductRequestDto,
    existingProduct: Product
  ): boolean {
    return (
      (updateProductRequestDto.name &&
        updateProductRequestDto.name !== existingProduct.getName()) ||
      (updateProductRequestDto.description &&
        updateProductRequestDto.description !== existingProduct.getDescription()) ||
      (updateProductRequestDto.price &&
        updateProductRequestDto.price !== existingProduct.getPrice().getValue()) ||
      (updateProductRequestDto.categories &&
        JSON.stringify(updateProductRequestDto.categories) !==
          JSON.stringify(existingProduct.getCategories()))
    );
  }
}
