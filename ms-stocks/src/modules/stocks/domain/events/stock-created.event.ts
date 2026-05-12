import { Stock } from '../entities/stock.entity';
import { DomainEvent } from './domain-event';

export class StockCreatedEvent extends DomainEvent<Stock> {
  constructor(correlationId: string, data: Stock, timestamp?: Date) {
    super(correlationId, data, timestamp);
  }
}
