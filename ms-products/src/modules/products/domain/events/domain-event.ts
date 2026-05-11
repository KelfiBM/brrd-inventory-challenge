import { CorrelationId } from '../value-objects/correlation-id.vo';

type DomainEventMetadata = {
  correlationId: CorrelationId;
  timestamp: Date;
};

export abstract class DomainEvent<T> {
  metadata: DomainEventMetadata;
  data: T;

  constructor(correlationId: string, data: T, timestamp?: Date) {
    this.metadata = {
      correlationId: new CorrelationId(correlationId),
      timestamp: timestamp || new Date(),
    };

    if (!data) {
      throw new Error('Domain event data cannot be null or undefined.');
    }

    this.data = data;
  }
}
