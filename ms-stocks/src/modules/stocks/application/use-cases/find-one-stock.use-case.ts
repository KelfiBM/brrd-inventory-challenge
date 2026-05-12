import { Inject, Injectable } from '@nestjs/common';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import {
  STOCK_REPOSITORY,
  StockRepositoryPort,
} from '../ports/stock.repository.port';
import { FindStockResponse } from '../types/find-stock.response.type';

type FindOneStockRequestDto = {
  id: ProductId;
  includeStockMovements?: boolean;
};

@Injectable()
export class FindOneStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(
    findOneStockRequestDto: FindOneStockRequestDto,
  ): Promise<FindStockResponse> {
    const stock = await this.stockRepository.findById(
      findOneStockRequestDto.id,
      findOneStockRequestDto.includeStockMovements,
    );

    if (!stock) {
      throw new Error(
        `Product with ID ${findOneStockRequestDto.id.getValue()} not found`,
      );
    }
    return {
      productId: stock.getId().getValue(),
      productName: stock.getName(),
      stock: stock.getStock().getValue(),
      movementHistory: stock.getMovements()?.map((movement) => ({
        quantity: movement.getQuantity().getValue(),
        type: movement.getType(),
        date: movement.getMovementDate(),
      })),
    };
  }
}
