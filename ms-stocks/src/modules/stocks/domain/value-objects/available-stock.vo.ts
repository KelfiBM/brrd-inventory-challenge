export class AvailableStock {
  private readonly value: number;

  constructor(value: number) {
    AvailableStock.ensureValidStock(value);
    this.value = value;
  }

  private static ensureValidStock(value: number) {
    if (value < 0) {
      throw new Error('Stock cannot be negative');
    }
  }

  getValue(): number {
    return this.value;
  }

  equals(other: AvailableStock): boolean {
    return this.value === other.getValue();
  }
}
