import { StockRepositoryPort } from '../../../../application/ports/stock.repository.port';
import { Stock } from '../../../../domain/entities/stock.entity';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';

export class TypeOrmStockRepository implements StockRepositoryPort {
  findById(id: ProductId, includeStockMovements?: boolean): Promise<Stock> {
    throw new Error('Method not implemented.');
  }
  save(product: Stock): Promise<Stock> {
    throw new Error('Method not implemented.');
  }
  remove(id: ProductId): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
