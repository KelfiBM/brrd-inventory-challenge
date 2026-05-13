import { CreateStockMovementCommand } from '../../commands/create-stock-movement.command';
import { StockChangedEvent } from '../../domain/events/stock-changed.event';

export interface StockEventEmitterPort {
  emitCreateStockMovementCommand(
    command: CreateStockMovementCommand,
  ): Promise<void>;
  emitStockCreated(event: StockChangedEvent): Promise<void>;
  emitStockUpdated(event: StockChangedEvent): Promise<void>;
  emitStockDeleted(event: StockChangedEvent): Promise<void>;
}

export const STOCK_EVENT_EMITTER = Symbol('STOCK_EVENT_EMITTER');
