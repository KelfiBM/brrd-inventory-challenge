import { CreateStockMovementCommand } from '../../commands/create-stock-movement.command';
import { StockCreatedEvent } from '../../domain/events/stock-created.event';
import { StockDeletedEvent } from '../../domain/events/stock-deleted.event';
import { StockUpdatedEvent } from '../../domain/events/stock-updated.event';

export interface StockEventEmitterPort {
  emitCreateStockMovementCommand(
    command: CreateStockMovementCommand,
  ): Promise<void>;
  emitStockCreated(event: StockCreatedEvent): Promise<void>;
  emitStockUpdated(event: StockUpdatedEvent): Promise<void>;
  emitStockDeleted(event: StockDeletedEvent): Promise<void>;
}

export const STOCK_EVENT_EMITTER = Symbol('STOCK_EVENT_EMITTER');
