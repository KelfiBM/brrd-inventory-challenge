import { Inject, Injectable, Optional } from '@nestjs/common';

import { ProductId } from '../../domain/value-objects/product-id.vo';

import { StockChangedEvent } from '../../domain/events/stock-changed.event';
import { AvailableStock } from '../../domain/value-objects/available-stock.vo';
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

type CreateStockMovementDto = {
  correlationId: CorrelationId;
  productId: ProductId;
  movementType: 'IN' | 'OUT';
  quantity: number;
};

@Injectable()
export class CreateStockMovementUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_EVENT_EMITTER)
    private readonly stockEventEmitter: StockEventEmitterPort,

    @Optional()
    @Inject(STOCK_LOGGER)
    private readonly logger?: StockLoggerPort,
  ) {}

  async execute(createStockMovementDto: CreateStockMovementDto): Promise<void> {
    this.logger?.verbose(
      'Executing CreateStockMovementUseCase with command:',
      createStockMovementDto,
    );

    if (!createStockMovementDto) {
      this.logger?.warn('CreateStockMovementCommand executed without data');
      return;
    }

    const productId = createStockMovementDto.productId;

    const existingStock = await this.stockRepository.findById(productId);

    if (!existingStock) {
      this.logger?.warn(
        `Stock with ID ${productId.getValue()} does not exist.`,
      );
      return;
    }

    existingStock.addMovement(
      new AvailableStock(createStockMovementDto.quantity),
      createStockMovementDto.movementType,
    );

    const savedStock = await this.stockRepository.save(existingStock);

    const stockChangedEvent = new StockChangedEvent(
      createStockMovementDto.correlationId,
      savedStock,
    );

    this.stockEventEmitter.emitStockUpdated(stockChangedEvent);
    this.logger?.verbose('Stock updated successfully:', savedStock);
  }
}
