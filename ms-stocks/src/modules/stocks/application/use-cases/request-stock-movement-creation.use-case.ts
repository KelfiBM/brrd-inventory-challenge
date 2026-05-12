import { Inject, Injectable } from '@nestjs/common';
import { CreateStockMovementCommand } from '../../commands/create-stock-movement.command';
import { MovementType } from '../../domain/enums/movement-type.enum';
import { ProductId } from '../../domain/value-objects/product-id.vo';

import {
  STOCK_EVENT_EMITTER,
  StockEventEmitterPort,
} from '../ports/stock.event-emitter.port';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';

type RequestStockMovementCreationDto = {
  productId: ProductId;
  movementType: 'IN' | 'OUT';
  amount: number;
};

@Injectable()
export class RequestStockMovementCreationUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
    @Inject(STOCK_EVENT_EMITTER)
    private readonly stockEventEmitter: StockEventEmitterPort,
  ) {}

  async execute(
    requestStockMovementCreationDto: RequestStockMovementCreationDto,
  ): Promise<ProductId> {
    const currentStock = await this.stockRepository.findById(
      requestStockMovementCreationDto.productId,
    );

    if (!currentStock) {
      throw new Error('Product not found');
    }

    const newStockValue =
      requestStockMovementCreationDto.movementType === MovementType.IN
        ? currentStock.getStock().getValue() +
          requestStockMovementCreationDto.amount
        : currentStock.getStock().getValue() -
          requestStockMovementCreationDto.amount;
    if (newStockValue < 0) {
      throw new Error('Insufficient stock for OUT movement');
    }

    const createStockMovementCommand = new CreateStockMovementCommand({
      productId: requestStockMovementCreationDto.productId.getValue(),
      quantity: requestStockMovementCreationDto.amount,
      type: requestStockMovementCreationDto.movementType,
    });
    await this.stockEventEmitter.emitCreateStockMovementCommand(
      createStockMovementCommand,
    );
    return requestStockMovementCreationDto.productId;
  }
}
