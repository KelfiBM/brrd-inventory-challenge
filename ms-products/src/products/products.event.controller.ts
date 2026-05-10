import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandNames, DomainEventNames } from '../configs/app.events';
import { routesV1 } from '../configs/app.routes';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductCommand } from './commands/update-product.command';
import { DomainEvent } from './domain-events/domain-event';
import { Product } from './entities/product.entity';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateCacheUseCase } from './use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateCacheUseCase: UpdateCacheUseCase
  ) {}

  @EventPattern(CommandNames.CREATE_PRODUCT)
  async handleCreateProductCommand(@Payload() createProductCommand: CreateProductCommand) {
    await this.createProductUseCase.execute(createProductCommand);
  }

  @EventPattern(CommandNames.UPDATE_PRODUCT)
  async handleUpdateProductCommand(@Payload() updateProductCommand: UpdateProductCommand) {
    await this.updateProductUseCase.execute(updateProductCommand);
  }

  @EventPattern([DomainEventNames.PRODUCT_CREATED, DomainEventNames.PRODUCT_UPDATED])
  async handleUpdateCacheEvent(@Payload() productEvent: DomainEvent<Product>) {
    await this.updateCacheUseCase.execute(productEvent);
  }
}
