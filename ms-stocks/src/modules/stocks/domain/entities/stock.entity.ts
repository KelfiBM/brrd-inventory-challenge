import { AvailableStock } from '../value-objects/available-stock.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { StockMovement } from './stock-movement.entity';

export class Stock {
  private constructor(
    private readonly productId: ProductId,
    private productName: string,
    private stock: AvailableStock,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly movements: StockMovement[] = [],
  ) {}

  static create(productId: string, productName: string, stock?: number): Stock {
    Stock.ensureValidName(productName);

    const now = new Date();
    return new Stock(
      new ProductId(productId),
      productName,
      new AvailableStock(stock || 0),
      now,
      now,
    );
  }

  private static ensureValidName(name: string) {
    if (!name || name.trim() === '') {
      throw new Error('Product name must be a non-empty string');
    }
  }

  getId(): ProductId {
    return this.productId;
  }

  getName(): string {
    return this.productName;
  }

  getStock(): AvailableStock {
    return this.stock;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }

  updateName(newName: string) {
    Stock.ensureValidName(newName);
    this.productName = newName;
    this.updatedAt = new Date();
  }

  addMovement(quantity: AvailableStock, type: 'IN' | 'OUT') {
    const valueChange =
      type === 'IN' ? quantity.getValue() : -quantity.getValue();
    const newStockValue = this.stock.getValue() + valueChange;

    if (newStockValue < 0) {
      throw new Error('Insufficient stock for this movement');
    }

    this.stock = new AvailableStock(newStockValue);
    this.updatedAt = new Date();
    this.movements.push(
      StockMovement.create(
        this.productId.getValue(),
        quantity.getValue(),
        type,
      ),
    );
  }
}
