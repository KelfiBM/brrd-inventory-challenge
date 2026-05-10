import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandNames, EventNames } from '../configs/app.events';
import { routesV1 } from '../configs/app.routes';
import { CreateProductCommand } from './commands/create-product.command';
import { DomainEvent } from './domain-events/domain-event';
import { Product } from './entities/product.entity';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { UpdateCacheUseCase } from './use-cases/update-cache.use-case';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateCacheUseCase: UpdateCacheUseCase
  ) {}

  @EventPattern(CommandNames.CREATE_PRODUCT)
  async handleCreateProductCommand(@Payload() createProductCommand: CreateProductCommand) {
    await this.createProductUseCase.execute(createProductCommand);
  }

  @EventPattern(EventNames.PRODUCT_CREATED)
  async handleProductCreatedEvent(@Payload() productCreatedEvent: DomainEvent<Product>) {
    await this.updateCacheUseCase.execute(productCreatedEvent);
  }
}
