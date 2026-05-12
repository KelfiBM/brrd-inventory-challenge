import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { StockEventEmitterPort } from '../../../application/ports/stock.event-emitter.port';
import { CreateStockMovementCommand } from '../../../commands/create-stock-movement.command';
import { CommandNames, DomainEventNames } from '../../../configs/stocks.consts';
import { StockCreatedEvent } from '../../../domain/events/stock-created.event';
import { StockDeletedEvent } from '../../../domain/events/stock-deleted.event';
import { StockUpdatedEvent } from '../../../domain/events/stock-updated.event';

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
  async emitStockCreated(event: StockCreatedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.STOCK_CREATED, event);
  }
  async emitStockUpdated(event: StockUpdatedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.STOCK_UPDATED, event);
  }
  async emitStockDeleted(event: StockDeletedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.STOCK_DELETED, event);
  }
}
