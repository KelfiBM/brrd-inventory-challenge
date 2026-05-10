export class ProductId {
  private readonly value: string;

  constructor(id: string) {
    ProductId.ensureValue(id);
    this.value = id;
  }

  private static ensureValue(id: string): void {
    if (!id) {
      throw new Error('Product ID is required');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductId): boolean {
    return this.value === other.getValue();
  }
}
