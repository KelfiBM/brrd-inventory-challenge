export class CorrelationId {
  private readonly value: string;

  constructor(id: string) {
    CorrelationId.ensureValue(id);
    this.value = id;
  }

  private static ensureValue(id: string): void {
    if (!id) {
      throw new Error('Correlation ID is required');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CorrelationId): boolean {
    return this.value === other.getValue();
  }
}
