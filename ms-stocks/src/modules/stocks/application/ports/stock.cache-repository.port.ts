import { StockDbEntity } from '../../infrastructure/adapters/stock-repository/type-orm-stock-repository/db-entities/stock.db-entity';

export interface StockCacheRepositoryPort {
  findById(productId: string): Promise<StockDbEntity | null>;
  save(stock: StockDbEntity): Promise<StockDbEntity>;
  remove(productId: string): Promise<void>;
}

export const STOCK_CACHE_REPOSITORY = Symbol('STOCK_CACHE_REPOSITORY');
