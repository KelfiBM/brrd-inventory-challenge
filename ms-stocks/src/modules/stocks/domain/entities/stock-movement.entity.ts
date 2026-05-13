import { AvailableStock } from '../value-objects/available-stock.vo';

export class StockMovement {
  private constructor(
    private readonly quantity: AvailableStock,
    private readonly type: 'IN' | 'OUT',
    private readonly movementDate: Date,
  ) {}

  static create(
    quantity: AvailableStock,
    type: 'IN' | 'OUT',
    movementDate?: Date,
  ): StockMovement {
    return new StockMovement(quantity, type, movementDate ?? new Date());
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
