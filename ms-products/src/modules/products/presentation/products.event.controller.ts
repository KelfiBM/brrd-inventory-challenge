import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { routesV1 } from '../../../configs/app.routes';
import { CreateProductUseCase } from '../application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from '../application/use-cases/delete-product.use-case';
import { UpdateProductUseCase } from '../application/use-cases/update-product.use-case';
import { CreateProductCommand } from '../commands/create-product.command';
import { DeleteProductCommand } from '../commands/delete-product.command';
import { UpdateProductCommand } from '../commands/update-product.command';
import { CommandNames } from '../configs/products.consts';
import { CorrelationId } from '../domain/value-objects/correlation-id.vo';
import { Price } from '../domain/value-objects/price.vo';
import { ProductCategory } from '../domain/value-objects/product-category.vo';
import { ProductId } from '../domain/value-objects/product-id.vo';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase
  ) {}

  @EventPattern(CommandNames.CREATE_PRODUCT)
  async handleCreateProductCommand(@Payload() createProductCommand: CreateProductCommand) {
    if (!createProductCommand?.data) {
      return;
    }
    let price: Price;
    let categories: ProductCategory[];
    let id: ProductId;
    let correlationId: CorrelationId;

    try {
      price = new Price(createProductCommand.data.price);
      categories = createProductCommand.data.categories.map((cat) => new ProductCategory(cat));
      id = new ProductId(createProductCommand.data.id);
      correlationId = new CorrelationId(createProductCommand.metadata.correlationId);
    } catch (error) {
      // Handle any errors that occur during product creation
      console.error('Error handling CreateProductCommand:', error);
      return;
    }
    try {
      await this.createProductUseCase.execute({
        name: createProductCommand.data.name,
        description: createProductCommand.data.description,
        price: price,
        categories: categories,
        sku: createProductCommand.data.sku,
        id: id,
        correlationId: correlationId,
      });
    } catch (error) {
      console.error('Error executing CreateProductCommand use case:', error);
    }
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
      correlationId: updateProductCommand.metadata.correlationId,
    });
  }

  @EventPattern(CommandNames.DELETE_PRODUCT)
  async handleDeleteProductCommand(@Payload() deleteProductCommand: DeleteProductCommand) {
    if (!deleteProductCommand?.data) {
      return;
    }

    try {
      await this.deleteProductUseCase.execute({
        id: new ProductId(deleteProductCommand.data.id),
        correlationId: deleteProductCommand.metadata.correlationId,
      });
    } catch (error) {
      console.error('Error executing DeleteProductCommand use case:', error);
    }
  }
}
