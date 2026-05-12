import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { routesV1 } from '../../../configs/app.routes';
import { CreateStockMovementUseCase } from '../application/use-cases/create-stock-movement.use-case';
import { CreateStockUseCase } from '../application/use-cases/create-stock.use-case';
import { DeleteStockUseCase } from '../application/use-cases/delete-stock.use-case';
import { UpdateStockUseCase } from '../application/use-cases/update-stock.use-case';
import { CreateStockMovementCommand } from '../commands/create-stock-movement.command';
import { CommandNames, DomainEventNames } from '../configs/stocks.consts';
import { Product } from '../domain/entities/product.entity';
import { DomainEvent } from '../domain/events/domain-event';
import { ProductId } from '../domain/value-objects/product-id.vo';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(
    private readonly createStockUseCase: CreateStockUseCase,
    private readonly createStockMovementUseCase: CreateStockMovementUseCase,
    private readonly updateStockUseCase: UpdateStockUseCase,
    private readonly deleteStockUseCase: DeleteStockUseCase,
  ) {}

  @EventPattern(DomainEventNames.PRODUCT_CREATED)
  async handleStockCreatedEvent(
    @Payload() stockCreatedEvent: DomainEvent<Product>,
  ) {
    if (!stockCreatedEvent?.data) {
      return;
    }

    await this.createStockUseCase.execute({
      productId: stockCreatedEvent.data.getId().getValue(),
      productName: stockCreatedEvent.data.getName(),
      correlationId: stockCreatedEvent.metadata.correlationId.getValue(),
    });
  }

  @EventPattern(DomainEventNames.PRODUCT_UPDATED)
  async handleStockUpdatedEvent(
    @Payload() stockUpdatedEvent: DomainEvent<Product>,
  ) {
    if (!stockUpdatedEvent?.data) {
      return;
    }

    await this.updateStockUseCase.execute({
      productId: stockUpdatedEvent.data.getId(),
      productName: stockUpdatedEvent.data.getName(),
      correlationId: stockUpdatedEvent.metadata.correlationId.getValue(),
    });
  }

  @EventPattern(DomainEventNames.PRODUCT_DELETED)
  async handleStockDeletedEvent(
    @Payload() stockDeletedEvent: DomainEvent<Product>,
  ) {
    if (!stockDeletedEvent?.data) {
      return;
    }

    await this.deleteStockUseCase.execute({
      id: stockDeletedEvent.data.getId(),
      correlationId: stockDeletedEvent.metadata.correlationId.getValue(),
    });
  }

  @EventPattern(CommandNames.CREATE_STOCK_MOVEMENT)
  async handleCreateStockMovementCommand(
    @Payload() createStockMovementCommand: CreateStockMovementCommand,
  ) {
    if (!createStockMovementCommand?.data) {
      return;
    }

    await this.createStockMovementUseCase.execute({
      productId: new ProductId(createStockMovementCommand.data.productId),
      movementType: createStockMovementCommand.data.type,
      quantity: createStockMovementCommand.data.quantity,
      correlationId:
        createStockMovementCommand.metadata.correlationId.getValue(),
    });
  }
}
