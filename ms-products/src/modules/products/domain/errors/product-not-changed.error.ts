export class ProductNotChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductNotChangedError';
  }
}
