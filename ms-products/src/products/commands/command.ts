import { randomUUID } from 'node:crypto';
import { CorrelationId } from '../value-objects/correlation-id.vo';

type CommandMetadata = {
  correlationId: CorrelationId;
  timestamp: Date;
};

export abstract class Command<T> {
  readonly metadata: CommandMetadata;
  readonly data?: T;

  constructor(correlationId?: string, timestamp?: Date, data?: T) {
    this.metadata = {
      correlationId: new CorrelationId(correlationId || randomUUID()),
      timestamp: timestamp || new Date(),
    };
    this.data = data;
  }
}
