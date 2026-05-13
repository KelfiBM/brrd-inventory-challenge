export class StockNotEnoughError extends Error {
  constructor(
    message: string,
    public readonly productId?: string,
  ) {
    super(message);
    this.name = 'StockNotEnoughError';
  }
}
