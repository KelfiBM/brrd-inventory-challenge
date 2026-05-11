import { Product } from '../entities/product.entity';
import { DomainEvent } from './domain-event';

export class ProductCreatedEvent extends DomainEvent<Product> {
  constructor(correlationId: string, data: Product, timestamp?: Date) {
    super(correlationId, data, timestamp);
  }
}
