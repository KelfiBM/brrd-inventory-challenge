import { randomUUID } from 'crypto';
import { CorrelationId } from '../value-objects/correlation-id.vo';

type CommandMetadata = {
  correlationId: CorrelationId;
  timestamp: Date;
};

export class Command {
  readonly metadata: CommandMetadata;

  constructor(correlationId?: string, timestamp?: Date) {
    this.metadata = {
      correlationId: new CorrelationId(correlationId || randomUUID()),
      timestamp: timestamp || new Date(),
    };
  }
}
