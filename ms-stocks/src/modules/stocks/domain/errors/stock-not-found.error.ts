export class StockNotFoundError extends Error {
  constructor(
    message: string,
    public readonly productId?: string,
  ) {
    super(message);
    this.name = 'StockNotFoundError';
  }
}
