import { Inject, Injectable, Optional } from '@nestjs/common';
import { StockUpdatedEvent } from '../../domain/events/stock-updated.event';

import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  STOCK_EVENT_EMITTER,
  StockEventEmitterPort,
} from '../ports/stock.event-emitter.port';
import { STOCK_LOGGER, StockLoggerPort } from '../ports/stock.logger.port';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';

type UpdateStockDto = {
  correlationId: string;
  productId: ProductId;
  productName: string;
};

@Injectable()
export class UpdateStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_EVENT_EMITTER)
    private readonly stockEventEmitter: StockEventEmitterPort,

    @Optional()
    @Inject(STOCK_LOGGER)
    private readonly logger?: StockLoggerPort,
  ) {}

  async execute(updateStockDto: UpdateStockDto): Promise<void> {
    this.logger?.verbose(
      'Executing UpdateStockUseCase with command: {UpdateStockCommand}',
      updateStockDto,
    );
    if (!updateStockDto) {
      this.logger?.warn('UpdateStockCommand executed without data');
      return;
    }

    const existingStock = await this.stockRepository.findById(
      updateStockDto.productId,
    );

    if (!existingStock) {
      this.logger?.warn(
        `Stock with ID ${updateStockDto.productId.getValue()} does not exist.`,
      );
      return;
    }

    existingStock.updateName(
      updateStockDto.productName || existingStock.getName(),
    );

    await this.stockRepository.save(existingStock);

    const stockUpdatedEvent = new StockUpdatedEvent(
      updateStockDto.correlationId,
      existingStock,
    );

    this.stockEventEmitter.emitStockUpdated(stockUpdatedEvent);
    this.logger?.log(
      `Stock with ID ${updateStockDto.productId.getValue()} updated successfully.`,
    );
  }
}
