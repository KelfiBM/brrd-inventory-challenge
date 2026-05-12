import { Command } from './command';

type CreateStockMovementData = {
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
};

export class CreateStockMovementCommand extends Command<CreateStockMovementData> {
  constructor(
    data: CreateStockMovementData,
    correlationId?: string,
    timestamp?: Date,
  ) {
    if (!data) {
      throw new Error('Data for CreateStockMovementCommand is required');
    }
    super(correlationId, timestamp, data);
  }
}
