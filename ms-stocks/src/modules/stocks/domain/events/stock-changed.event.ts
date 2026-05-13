import { Stock } from '../entities/stock.entity';
import { CorrelationId } from '../value-objects/correlation-id.vo';
import { DomainEvent } from './domain-event';

export class StockChangedEvent extends DomainEvent<Stock> {
  constructor(correlationId: CorrelationId, data: Stock, timestamp?: Date) {
    super(correlationId, data, timestamp);
  }
}
