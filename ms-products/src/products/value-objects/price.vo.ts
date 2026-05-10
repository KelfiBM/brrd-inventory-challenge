export class Price {
  private readonly value: number;

  constructor(value: number) {
    Price.ensureValidPrice(value);
    this.value = value;
  }

  private static ensureValidPrice(value: number) {
    if (value < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Price): boolean {
    return this.value === other.getValue();
  }
}
