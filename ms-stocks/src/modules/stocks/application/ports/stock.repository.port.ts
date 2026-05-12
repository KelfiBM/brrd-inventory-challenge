import { Stock } from '../../domain/entities/stock.entity';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export interface StockRepositoryPort {
  findById(id: ProductId, includeStockMovements?: boolean): Promise<Stock>;
  save(product: Stock): Promise<Stock>;
  remove(id: ProductId): Promise<void>;
}

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
