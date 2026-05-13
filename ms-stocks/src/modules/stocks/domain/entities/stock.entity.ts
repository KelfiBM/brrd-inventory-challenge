import { StockNotEnoughError } from '../errors/stock-not-enough.error';
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

  static create(
    productId: ProductId,
    productName: string,
    stock?: AvailableStock,
    movements: StockMovement[] = [],
    createdAt?: Date,
    updatedAt?: Date,
  ): Stock {
    Stock.ensureValidName(productName);

    const now = new Date();
    return new Stock(
      productId,
      productName,
      stock || new AvailableStock(0),
      createdAt || now,
      updatedAt || now,
      movements,
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
      throw new StockNotEnoughError('Insufficient stock for this movement');
    }

    this.stock = new AvailableStock(newStockValue);
    this.updatedAt = new Date();
    this.movements.push(StockMovement.create(quantity, type));
  }
}
