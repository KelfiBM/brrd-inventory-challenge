export class ProductNotFoundError extends Error {
  constructor(message: string, public readonly productId?: string) {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}