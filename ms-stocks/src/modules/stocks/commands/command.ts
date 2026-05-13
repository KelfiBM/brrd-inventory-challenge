import { randomUUID } from 'node:crypto';

type CommandMetadata = {
  correlationId: string;
  timestamp: Date;
};

export abstract class Command<T> {
  readonly metadata: CommandMetadata;
  readonly data?: T;

  constructor(correlationId?: string, timestamp?: Date, data?: T) {
    this.metadata = {
      correlationId: correlationId || randomUUID(),
      timestamp: timestamp || new Date(),
    };
    this.data = data;
  }
}
