import { Inject, Injectable, Optional } from '@nestjs/common';
import { StockChangedEvent } from '../../domain/events/stock-changed.event';
import { CorrelationId } from '../../domain/value-objects/correlation-id.vo';
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

type DeleteProductDto = {
  correlationId: CorrelationId;
  id: ProductId;
};

@Injectable()
export class DeleteStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_EVENT_EMITTER)
    private readonly stockEventEmitter: StockEventEmitterPort,

    @Optional()
    @Inject(STOCK_LOGGER)
    private readonly logger?: StockLoggerPort,
  ) {}

  async execute(deleteProductDto: DeleteProductDto): Promise<void> {
    this.logger?.verbose(
      'Executing DeleteProductUseCase with command: {DeleteProductCommand}',
      deleteProductDto,
    );
    if (!deleteProductDto) {
      this.logger?.warn('DeleteProductCommand executed without data');
      return;
    }

    const existingProduct = await this.stockRepository.findById(
      deleteProductDto.id,
    );

    if (!existingProduct) {
      this.logger?.warn(
        `Product with ID ${deleteProductDto.id.getValue()} does not exist.`,
      );
      return;
    }

    await this.stockRepository.remove(deleteProductDto.id);

    const stockDeletedEvent = new StockChangedEvent(
      deleteProductDto.correlationId,
      existingProduct,
    );

    this.stockEventEmitter.emitStockDeleted(stockDeletedEvent);
    this.logger?.log(
      `Stock with ID ${deleteProductDto.id.getValue()} deleted successfully.`,
    );
  }
}
