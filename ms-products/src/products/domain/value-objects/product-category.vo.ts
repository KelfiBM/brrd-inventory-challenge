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
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductCategory): boolean {
    return this.value === other.getValue();
  }
}
