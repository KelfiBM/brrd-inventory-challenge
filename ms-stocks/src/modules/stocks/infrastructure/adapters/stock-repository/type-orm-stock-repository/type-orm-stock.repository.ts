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
import { StockDbEntity } from './schema/stock.db-entity';

@Injectable()
export class TypeOrmStockRepository implements StockRepositoryPort {
  constructor(
    @InjectRepository(StockDbEntity)
    private readonly stockRepository: Repository<StockDbEntity>,

    @Inject(STOCK_CACHE_REPOSITORY)
    private readonly stockCacheRepository: StockCacheRepositoryPort,
  ) {}

  async findById(
    id: ProductId,
    includeStockMovements?: boolean,
  ): Promise<Stock | null> {
    const getStockFromCache =
      await this.stockCacheRepository.getStockByProductId(id.getValue());
    if (getStockFromCache) {
      return this.mapToDomainEntity(getStockFromCache);
    }
    const stock = await this.stockRepository.findOne({
      where: { productId: id.getValue() } as any,
      relations: includeStockMovements ? ['stockMovements'] : [],
    });
    if (stock) {
      const domainStock = this.mapToDomainEntity(stock);
      await this.stockCacheRepository.setStockByProductId(id.getValue(), stock);
      return domainStock;
    }
    return null;
  }
  async save(product: Stock): Promise<Stock> {
    const stockDbEntity = this.mapToDbEntity(product);
    const savedStock = await this.stockRepository.save(stockDbEntity);
    await this.stockCacheRepository.setStockByProductId(
      savedStock.productId,
      savedStock,
    );
    return this.mapToDomainEntity(savedStock);
  }
  async remove(id: ProductId): Promise<void> {
    await this.stockRepository.delete({ productId: id.getValue() } as any);
    await this.stockCacheRepository.removeStockByProductId(id.getValue());
  }

  private mapToDomainEntity(stockDbEntity: StockDbEntity): Stock {
    return Stock.create(
      stockDbEntity.productId,
      stockDbEntity.productName,
      stockDbEntity.stock,
      stockDbEntity.stockMovements,
      stockDbEntity.createdAt,
      stockDbEntity.updatedAt,
    );
  }

  private mapToDbEntity(stock: Stock): StockDbEntity {
    const stockDbEntity = new StockDbEntity();
    stockDbEntity.productId = stock.getId().getValue();
    stockDbEntity.productName = stock.getName();
    stockDbEntity.stock = stock.getStock().getValue();
    stockDbEntity.stockMovements = stock.getMovements();
    stockDbEntity.createdAt = stock.getCreatedAt();
    stockDbEntity.updatedAt = stock.getUpdatedAt();
    return stockDbEntity;
  }
}
