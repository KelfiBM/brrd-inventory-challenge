import { Command } from './command';

type CreateProductData = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
};

export class CreateProductCommand extends Command<CreateProductData> {
  constructor(data: CreateProductData, correlationId?: string, timestamp?: Date) {
    if (!data) {
      throw new Error('Data for CreateProductCommand is required');
    }
    super(correlationId, timestamp, data);
  }
}
