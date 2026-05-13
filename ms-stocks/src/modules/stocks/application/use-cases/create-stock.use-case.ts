import { Inject, Injectable, Optional } from '@nestjs/common';
import { Stock } from '../../domain/entities/stock.entity';
import { ProductId } from '../../domain/value-objects/product-id.vo';

import { StockChangedEvent } from '../../domain/events/stock-changed.event';
import { CorrelationId } from '../../domain/value-objects/correlation-id.vo';
import {
  STOCK_EVENT_EMITTER,
  StockEventEmitterPort,
} from '../ports/stock.event-emitter.port';
import { STOCK_LOGGER, StockLoggerPort } from '../ports/stock.logger.port';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';

type CreateStockDto = {
  correlationId: CorrelationId;
  productId: ProductId;
  productName: string;
};

@Injectable()
export class CreateStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_EVENT_EMITTER)
    private readonly stockEventEmitter: StockEventEmitterPort,

    @Optional()
    @Inject(STOCK_LOGGER)
    private readonly logger?: StockLoggerPort,
  ) {}

  async execute(createStockDto: CreateStockDto): Promise<void> {
    this.logger?.verbose(
      'Executing CreateStockUseCase with command:',
      createStockDto,
    );

    if (!createStockDto) {
      this.logger?.warn('CreateStockCommand executed without data');
      return;
    }

    const productId = createStockDto.productId;

    const existingStock = await this.stockRepository.findById(productId);

    if (existingStock) {
      this.logger?.warn(
        `Stock with ID ${productId.getValue()} already exists.`,
      );
      return;
    }

    const newStock = Stock.create(
      createStockDto.productId,
      createStockDto.productName,
    );

    const savedStock = await this.stockRepository.save(newStock);

    const stockChangedEvent = new StockChangedEvent(
      createStockDto.correlationId,
      savedStock,
    );

    this.stockEventEmitter.emitStockCreated(stockChangedEvent);
    this.logger?.verbose('Stock created successfully:', savedStock);
  }
}
