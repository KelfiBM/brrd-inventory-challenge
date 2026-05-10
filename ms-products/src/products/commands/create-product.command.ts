import { Command } from './command';

export class CreateProductCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly categories: string[],
    public readonly sku: string,
    correlationId?: string,
    timestamp?: Date
  ) {
    super(correlationId, timestamp);
  }
}
