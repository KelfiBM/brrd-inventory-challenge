import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { routesV1 } from '../../../configs/app.routes';
import { CreateStockMovementUseCase } from '../application/use-cases/create-stock-movement.use-case';
import { CreateStockUseCase } from '../application/use-cases/create-stock.use-case';
import { DeleteStockUseCase } from '../application/use-cases/delete-stock.use-case';
import { UpdateStockUseCase } from '../application/use-cases/update-stock.use-case';
import { CreateStockMovementCommand } from '../commands/create-stock-movement.command';
import { CommandNames, DomainEventNames } from '../configs/stocks.consts';
import { CorrelationId } from '../domain/value-objects/correlation-id.vo';
import { ProductId } from '../domain/value-objects/product-id.vo';
import { EventRequestDto } from './dtos/event-request.dto';
import { ProductChangedEventRequestDto } from './dtos/product.event-request.dto';

@Controller(routesV1.version)
export class StocksEventController {
  constructor(
    private readonly createStockUseCase: CreateStockUseCase,
    private readonly createStockMovementUseCase: CreateStockMovementUseCase,
    private readonly updateStockUseCase: UpdateStockUseCase,
    private readonly deleteStockUseCase: DeleteStockUseCase,
  ) {}

  @EventPattern(DomainEventNames.PRODUCT_CREATED)
  async handleStockCreatedEvent(
    @Payload()
    productCreatedEvent: EventRequestDto<ProductChangedEventRequestDto>,
  ) {
    if (!productCreatedEvent?.data) {
      return;
    }
    let productId: ProductId;
    let correlationId: CorrelationId;
    try {
      productId = new ProductId(productCreatedEvent.data.id);
      correlationId = new CorrelationId(
        productCreatedEvent.metadata.correlationId,
      );
    } catch (error) {
      console.error(
        'Error creating ProductId or CorrelationId from event data:',
        error,
      );
      return;
    }

    await this.createStockUseCase.execute({
      productId: productId,
      productName: productCreatedEvent.data.name,
      correlationId: correlationId,
    });
  }

  @EventPattern(DomainEventNames.PRODUCT_UPDATED)
  async handleStockUpdatedEvent(
    @Payload()
    stockUpdatedEvent: EventRequestDto<ProductChangedEventRequestDto>,
  ) {
    if (!stockUpdatedEvent?.data) {
      return;
    }

    let productId: ProductId;
    let correlationId: CorrelationId;
    try {
      productId = new ProductId(stockUpdatedEvent.data.id);
      correlationId = new CorrelationId(
        stockUpdatedEvent.metadata.correlationId,
      );
    } catch (error) {
      console.error(
        'Error creating ProductId or CorrelationId from event data:',
        error,
      );
      return;
    }

    await this.updateStockUseCase.execute({
      productId: productId,
      productName: stockUpdatedEvent.data.name,
      correlationId: correlationId,
    });
  }

  @EventPattern(DomainEventNames.PRODUCT_DELETED)
  async handleStockDeletedEvent(
    @Payload()
    stockDeletedEvent: EventRequestDto<ProductChangedEventRequestDto>,
  ) {
    if (!stockDeletedEvent?.data) {
      return;
    }

    let productId: ProductId;
    let correlationId: CorrelationId;
    try {
      productId = new ProductId(stockDeletedEvent.data.id);
      correlationId = new CorrelationId(
        stockDeletedEvent.metadata.correlationId,
      );
    } catch (error) {
      console.error(
        'Error creating ProductId or CorrelationId from event data:',
        error,
      );
      return;
    }

    await this.deleteStockUseCase.execute({
      id: productId,
      correlationId: correlationId,
    });
  }

  @EventPattern(CommandNames.CREATE_STOCK_MOVEMENT)
  async handleCreateStockMovementCommand(
    @Payload() createStockMovementCommand: CreateStockMovementCommand,
  ) {
    if (!createStockMovementCommand?.data) {
      return;
    }

    let correlationId: CorrelationId;
    let productId: ProductId;
    try {
      correlationId = new CorrelationId(
        createStockMovementCommand.metadata.correlationId,
      );
      productId = new ProductId(createStockMovementCommand.data.productId);
    } catch (error) {
      console.error(
        'Error creating CorrelationId or ProductId from command data:',

        error,
      );
      return;
    }

    await this.createStockMovementUseCase.execute({
      productId: productId,
      movementType: createStockMovementCommand.data.type,
      quantity: createStockMovementCommand.data.quantity,
      correlationId: correlationId,
    });
  }
}
