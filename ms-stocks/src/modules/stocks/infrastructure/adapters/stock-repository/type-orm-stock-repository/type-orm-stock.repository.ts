import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  STOCK_CACHE_REPOSITORY,
  StockCacheRepositoryPort,
} from '../../../../application/ports/stock.cache-repository.port';
import { StockRepositoryPort } from '../../../../application/ports/stock.repository.port';
import { StockMovement } from '../../../../domain/entities/stock-movement.entity';
import { Stock } from '../../../../domain/entities/stock.entity';
import { AvailableStock } from '../../../../domain/value-objects/available-stock.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';
import { StockDbEntity } from './db-entities/stock.db-entity';

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
    const getStockFromCache = await this.stockCacheRepository.findById(
      id.getValue(),
    );
    if (getStockFromCache) {
      return this.mapToDomainEntity(getStockFromCache);
    }
    const stock = await this.stockRepository.findOne({
      where: { productId: id.getValue() } as any,
    });
    if (stock) {
      if (!includeStockMovements) {
        stock.stockMovements = [];
      }
      await this.stockCacheRepository.save(stock);
      return this.mapToDomainEntity(stock);
    }
    return null;
  }
  async save(product: Stock): Promise<Stock> {
    const stockDbEntity = this.mapToDbEntity(product);
    const savedStock = await this.stockRepository.save(stockDbEntity);
    await this.stockCacheRepository.save(savedStock);
    return this.mapToDomainEntity(savedStock);
  }
  async remove(id: ProductId): Promise<void> {
    await this.stockRepository.delete(id.getValue());
    await this.stockCacheRepository.remove(id.getValue());
  }

  private mapToDomainEntity(stockDbEntity: StockDbEntity): Stock {
    return Stock.create(
      new ProductId(stockDbEntity.productId),
      stockDbEntity.productName,
      new AvailableStock(stockDbEntity.stock),
      stockDbEntity.stockMovements.map((movement) =>
        StockMovement.create(
          new AvailableStock(movement.quantity),
          movement.type as 'IN' | 'OUT',
          movement.date,
        ),
      ),
      stockDbEntity.createdAt,
      stockDbEntity.updatedAt,
    );
  }

  private mapToDbEntity(stock: Stock): StockDbEntity {
    const stockDbEntity = new StockDbEntity();
    stockDbEntity.productId = stock.getId().getValue();
    stockDbEntity.productName = stock.getName();
    stockDbEntity.stock = stock.getStock().getValue();
    stockDbEntity.stockMovements = stock.getMovements().map((movement) => ({
      quantity: movement.getQuantity().getValue(),
      type: movement.getType(),
      date: movement.getMovementDate(),
    }));
    stockDbEntity.createdAt = stock.getCreatedAt();
    stockDbEntity.updatedAt = stock.getUpdatedAt();
    return stockDbEntity;
  }
}
