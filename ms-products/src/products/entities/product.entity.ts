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
    private categories: ProductCategory[],
    private readonly sku: string,
    private readonly priceHistory: PriceHistoryEntry[] = [],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string,
    price: number,
    categories: string[],
    sku: string
  ): Product {
    Product.ensureValidName(name);
    Product.ensureValidCategories(categories);
    Product.ensureValidSku(sku);

    const productCategories = categories.map((cat) => new ProductCategory(cat));
    const now = new Date();

    return new Product(
      new ProductId(id),
      name,
      description,
      new Price(price),
      productCategories,
      sku,
      [{ price: new Price(price), changedAt: now }],
      now,
      now
    );
  }

  private static ensureValidName(name: string) {
    if (!name || name.trim() === '' || name.length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }
  }

  private static ensureValidCategories(categories: string[]) {
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

  updateName(newName: string) {
    Product.ensureValidName(newName);
    this.name = newName;
    this.updatedAt = new Date();
  }

  updateDescription(newDescription: string) {
    this.description = newDescription;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice: number) {
    const oldPrice = this.price;
    this.price = new Price(newPrice);
    this.updatedAt = new Date();
    this.priceHistory.push({ price: oldPrice, changedAt: this.updatedAt });
  }

  updateCategories(newCategories: string[]) {
    Product.ensureValidCategories(newCategories);
    this.categories = newCategories.map((cat) => new ProductCategory(cat));
    this.updatedAt = new Date();
  }
}
