import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { StockEventEmitterPort } from '../../../application/ports/stock.event-emitter.port';
import { CreateStockMovementCommand } from '../../../commands/create-stock-movement.command';
import { CommandNames, DomainEventNames } from '../../../configs/stocks.consts';
import { StockChangedEvent } from '../../../domain/events/stock-changed.event';

type StockChangedEventDto = {
  metadata: {
    correlationId: string;
    timestamp: Date;
  };
  data: {
    productId: string;
    productName: string;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
    movements: {
      movementType: 'IN' | 'OUT';
      amount: number;
      createdAt: Date;
    }[];
  };
};

@Injectable()
export class NestStockEventEmitter implements StockEventEmitterPort {
  constructor(
    @Inject(EVENT_STREAMING_CLIENT) private readonly nestClient: ClientProxy,
  ) {}
  async emitCreateStockMovementCommand(
    command: CreateStockMovementCommand,
  ): Promise<void> {
    this.nestClient.emit(CommandNames.CREATE_STOCK_MOVEMENT, command);
  }
  async emitStockCreated(event: StockChangedEvent): Promise<void> {
    this.nestClient.emit(
      DomainEventNames.STOCK_CREATED,
      this.mapStockChangedEventToDto(event),
    );
  }
  async emitStockUpdated(event: StockChangedEvent): Promise<void> {
    this.nestClient.emit(
      DomainEventNames.STOCK_UPDATED,
      this.mapStockChangedEventToDto(event),
    );
  }
  async emitStockDeleted(event: StockChangedEvent): Promise<void> {
    this.nestClient.emit(
      DomainEventNames.STOCK_DELETED,
      this.mapStockChangedEventToDto(event),
    );
  }

  private mapStockChangedEventToDto(
    event: StockChangedEvent,
  ): StockChangedEventDto {
    return {
      metadata: {
        correlationId: event.metadata.correlationId.getValue(),
        timestamp: event.metadata.timestamp,
      },
      data: {
        productId: event.data.getId().getValue(),
        productName: event.data.getName(),
        stock: event.data.getStock().getValue(),
        createdAt: event.data.getCreatedAt(),
        updatedAt: event.data.getUpdatedAt(),
        movements: event.data.getMovements().map((movement) => ({
          movementType: movement.getType(),
          amount: movement.getQuantity().getValue(),
          createdAt: movement.getMovementDate(),
        })),
      },
    };
  }
}
