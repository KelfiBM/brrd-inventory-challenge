import { Product } from '../entities/product.entity';
import { Command } from './command';

export class CreateProductCommand extends Command<Product> {
  constructor(data: Product, correlationId?: string, timestamp?: Date) {
    if (!data) {
      throw new Error('Data for CreateProductCommand is required');
    }
    super(correlationId, timestamp, data);
  }
}
