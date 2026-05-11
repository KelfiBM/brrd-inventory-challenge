import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandNames, DomainEventNames } from '../configs/app.events';
import { routesV1 } from '../configs/app.routes';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { InvalidateCacheUseCase } from './application/use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { CreateProductCommand } from './commands/create-product.command';
import { DeleteProductCommand } from './commands/delete-product.command';
import { UpdateProductCommand } from './commands/update-product.command';
import { DomainEvent } from './domain-events/domain-event';
import { Product } from './domain/entities/product.entity';
import { Price } from './domain/value-objects/price.vo';
import { ProductCategory } from './domain/value-objects/product-category.vo';
import { ProductId } from './domain/value-objects/product-id.vo';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly updateCacheUseCase: InvalidateCacheUseCase
  ) {}

  @EventPattern(CommandNames.CREATE_PRODUCT)
  async handleCreateProductCommand(@Payload() createProductCommand: CreateProductCommand) {
    if (!createProductCommand?.data) {
      return;
    }

    await this.createProductUseCase.execute({
      name: createProductCommand.data.name,
      description: createProductCommand.data.description,
      price: createProductCommand.data.price,
      categories: createProductCommand.data.categories,
      sku: createProductCommand.data.sku,
      id: createProductCommand.data.id,
      correlationId: createProductCommand.metadata.correlationId.getValue(),
    });
  }

  @EventPattern(CommandNames.UPDATE_PRODUCT)
  async handleUpdateProductCommand(@Payload() updateProductCommand: UpdateProductCommand) {
    if (!updateProductCommand?.data) {
      return;
    }

    await this.updateProductUseCase.execute({
      name: updateProductCommand.data.name,
      description: updateProductCommand.data.description,
      price: new Price(updateProductCommand.data.price),
      categories: updateProductCommand.data.categories.map((cat) => new ProductCategory(cat)),
      id: new ProductId(updateProductCommand.data.id),
      correlationId: updateProductCommand.metadata.correlationId.getValue(),
    });
  }

  @EventPattern(CommandNames.DELETE_PRODUCT)
  async handleDeleteProductCommand(@Payload() deleteProductCommand: DeleteProductCommand) {
    if (!deleteProductCommand?.data) {
      return;
    }

    await this.deleteProductUseCase.execute({
      id: new ProductId(deleteProductCommand.data.id),
      correlationId: deleteProductCommand.metadata.correlationId.getValue(),
    });
  }

  @EventPattern([
    DomainEventNames.PRODUCT_CREATED,
    DomainEventNames.PRODUCT_UPDATED,
    DomainEventNames.PRODUCT_DELETED,
  ])
  async handleInvalidateCacheEvent(@Payload() productEvent: DomainEvent<Product>) {
    await this.updateCacheUseCase.execute({
      product: productEvent.data,
    });
  }
}
