export class ProductCategory {
  private readonly value: string;

  constructor(value: string) {
    this.ensureValidValue(value);
    this.value = value;
  }

  ensureValidValue(categoryName: string) {
    if (!categoryName || categoryName.trim() === '') {
      throw new Error('Product category name cannot be empty');
    }
    if (new RegExp(/^[a-zA-Z0-9\s]+$/).exec(categoryName) === null) {
      throw new Error('Product category name can only contain letters, numbers, and spaces');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductCategory): boolean {
    return this.value === other.getValue();
  }
}
