import { ProductId } from '../value-objects/product-id.vo';

export class Product {
  private constructor(
    private readonly id: ProductId,
    private name: string,
  ) {}

  static create(id: string, name: string): Product {
    Product.ensureValidName(name);
    return new Product(new ProductId(id), name);
  }

  private static ensureValidName(name: string) {
    if (!name || name.trim() === '') {
      throw new Error('Product name must be a non-empty string');
    }
  }

  getId(): ProductId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  updateName(newName: string) {
    Product.ensureValidName(newName);
    this.name = newName;
  }
}
