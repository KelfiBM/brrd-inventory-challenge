import { Command } from './command';

type DeleteProductData = {
  id: string;
};

export class DeleteProductCommand extends Command<DeleteProductData> {
  constructor(data: DeleteProductData, correlationId?: string, timestamp?: Date) {
    if (!data) {
      throw new Error('Data for DeleteProductCommand is required');
    }
    super(correlationId, timestamp, data);
  }
}
