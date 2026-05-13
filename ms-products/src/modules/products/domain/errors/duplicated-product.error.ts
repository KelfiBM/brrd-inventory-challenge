export class DuplicatedProductError extends Error {
  constructor(message?: string) {
    super(message || `Product already exists.`);
    this.name = 'DuplicatedProductError';
  }
}