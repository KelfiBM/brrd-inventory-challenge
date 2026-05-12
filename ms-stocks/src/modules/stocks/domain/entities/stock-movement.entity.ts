import { AvailableStock } from '../value-objects/available-stock.vo';
import { ProductId } from '../value-objects/product-id.vo';

export class StockMovement {
  private constructor(
    private readonly productId: ProductId,
    private readonly quantity: AvailableStock,
    private readonly type: 'IN' | 'OUT',
    private readonly movementDate: Date,
  ) {}

  static create(
    productId: string,
    quantity: number,
    type: 'IN' | 'OUT',
  ): StockMovement {
    return new StockMovement(
      new ProductId(productId),
      new AvailableStock(quantity),
      type,
      new Date(),
    );
  }

  getId(): ProductId {
    return this.productId;
  }

  getQuantity(): AvailableStock {
    return this.quantity;
  }

  getType(): 'IN' | 'OUT' {
    return this.type;
  }

  getMovementDate(): Date {
    return this.movementDate;
  }
}
