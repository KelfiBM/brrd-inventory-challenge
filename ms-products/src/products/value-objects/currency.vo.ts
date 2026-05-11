export class Currency {
  private readonly value: string;

  constructor(value: string) {
    Currency.ensureValidCurrency(value);
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  private static ensureValidCurrency(value: string) {
    if (!value) {
      throw new Error('Currency cannot be empty');
    }
    if (value.length !== 3) {
      throw new Error('Currency must be a 3-letter code. ISO 4217 format required');
    }
  }
  equals(other: Currency): boolean {
    return this.value === other.getValue();
  }
}
