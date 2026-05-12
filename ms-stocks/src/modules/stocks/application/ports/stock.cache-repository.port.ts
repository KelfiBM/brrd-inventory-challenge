import { StockDbEntity } from '../../infrastructure/adapters/stock-repository/type-orm-stock-repository/schema/stock.db-entity';

export interface StockCacheRepositoryPort {
  getStockByProductId(productId: string): Promise<StockDbEntity | null>;
  setStockByProductId(
    productId: string,
    stock: StockDbEntity,
  ): Promise<StockDbEntity>;
  removeStockByProductId(productId: string): Promise<void>;
}

export const STOCK_CACHE_REPOSITORY = Symbol('STOCK_CACHE_REPOSITORY');
