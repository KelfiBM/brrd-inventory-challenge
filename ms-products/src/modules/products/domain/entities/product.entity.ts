import { Currency } from '../value-objects/currency.vo';
import { Price } from '../value-objects/price.vo';
import { ProductCategory } from '../value-objects/product-category.vo';
import { ProductId } from '../value-objects/product-id.vo';

type PriceHistoryEntry = {
  price: Price;
  changedAt: Date;
};

export class Product {
  private constructor(
    private readonly id: ProductId,
    private name: string,
    private description: string,
    private price: Price,
    private readonly currency: Currency,
    private categories: ProductCategory[],
    private readonly sku: string,
    private readonly priceHistory: PriceHistoryEntry[] = [],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create({
    id,
    name,
    description,
    price,
    categories,
    sku,
    currency = new Currency('DOP'),
    priceHistory = []
  }: {
    id: ProductId;
    name: string;
    description: string;
    price: Price;
    categories: ProductCategory[];
    sku: string;
    currency?: Currency;
    priceHistory?: PriceHistoryEntry[];
  }): Product {
    Product.ensureValidName(name);
    Product.ensureValidSku(sku);

    Product.ensureValidCategories(categories);
    const now = new Date();

    return new Product(
      id,
      name,
      description,
      price,
      currency,
      categories,
      sku,
      priceHistory.length > 0 ? priceHistory : [{ price: price, changedAt: now }],
      now,
      now
    );
  }

  private static ensureValidName(name: string) {
    if (!name || name.trim() === '') {
      throw new Error('Product name must be a non-empty string');
    }
  }

  private static ensureValidCategories(categories: ProductCategory[]) {
    if (!categories || categories.length === 0) {
      throw new Error('Product must have at least one category');
    }
  }

  private static ensureValidSku(sku: string) {
    if (!sku || sku.trim() === '') {
      throw new Error('Product SKU must be a non-empty string');
    }
  }

  getId(): ProductId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getPrice(): Price {
    return this.price;
  }

  getCategories(): ProductCategory[] {
    return this.categories;
  }

  getSku(): string {
    return this.sku;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getPriceHistory(): PriceHistoryEntry[] {
    return this.priceHistory;
  }

  updateName(newName: string) {
    Product.ensureValidName(newName);
    this.name = newName;
    this.updatedAt = new Date();
  }

  updateDescription(newDescription: string) {
    this.description = newDescription;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice: Price) {
    const oldPrice = this.price;
    this.price = newPrice;
    this.updatedAt = new Date();
    this.priceHistory.push({ price: oldPrice, changedAt: this.updatedAt });
  }

  updateCategories(newCategories: ProductCategory[]) {
    Product.ensureValidCategories(newCategories);
    this.categories = newCategories;
    this.updatedAt = new Date();
  }
}
