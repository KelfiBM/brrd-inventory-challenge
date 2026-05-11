import { Command } from './command';

type UpdateProductData = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
};

export class UpdateProductCommand extends Command<UpdateProductData> {
  constructor(data: UpdateProductData, correlationId?: string, timestamp?: Date) {
    if (!data) {
      throw new Error('Data for UpdateProductCommand is required');
    }
    super(correlationId, timestamp, data);
  }
}
