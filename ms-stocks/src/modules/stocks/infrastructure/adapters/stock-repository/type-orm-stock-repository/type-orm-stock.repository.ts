import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  STOCK_CACHE_REPOSITORY,
  StockCacheRepositoryPort,
} from '../../../../application/ports/stock.cache-repository.port';
import { StockRepositoryPort } from '../../../../application/ports/stock.repository.port';
import { Stock } from '../../../../domain/entities/stock.entity';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';

@Injectable()
export class TypeOrmStockRepository implements StockRepositoryPort {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    @Inject(STOCK_CACHE_REPOSITORY)
    private readonly stockCacheRepository: StockCacheRepositoryPort,
  ) {}

  async findById(
    id: ProductId,
    includeStockMovements?: boolean,
  ): Promise<Stock | null> {
    const getStockFromCache =
      await this.stockCacheRepository.getStockByProductId(id);
    if (getStockFromCache) {
      return getStockFromCache;
    }
    const stock = await this.stockRepository.findOne({
      where: { productId: id.getValue() } as any,
      relations: includeStockMovements ? ['stockMovements'] : [],
    });
    if (stock) {
      await this.stockCacheRepository.setStockByProductId(id, stock);
      return stock;
    }
    return null;
  }
  async save(product: Stock): Promise<Stock> {
    const savedStock = await this.stockRepository.save(product);
    await this.stockCacheRepository.setStockByProductId(
      savedStock.getId(),
      savedStock,
    );
    return savedStock;
  }
  async remove(id: ProductId): Promise<void> {
    await this.stockRepository.delete({ productId: id.getValue() } as any);
    await this.stockCacheRepository.removeStockByProductId(id);
  }
}
