import { Stock } from '../../domain/entities/stock.entity';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export interface StockCacheRepositoryPort {
  getStockByProductId(productId: ProductId): Promise<Stock | null>;
  setStockByProductId(productId: ProductId, stock: Stock): Promise<Stock>;
  removeStockByProductId(productId: ProductId): Promise<void>;
}

export const STOCK_CACHE_REPOSITORY = Symbol('STOCK_CACHE_REPOSITORY');
