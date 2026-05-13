export class ProductChangedEventRequestDto {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
  priceHistory: { price: number; date: string }[];
}
