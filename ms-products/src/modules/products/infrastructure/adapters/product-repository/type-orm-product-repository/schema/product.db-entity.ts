export class ProductDbEntity {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categories: string[];
  priceHistory: { price: number; changedAt: Date }[];
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}
