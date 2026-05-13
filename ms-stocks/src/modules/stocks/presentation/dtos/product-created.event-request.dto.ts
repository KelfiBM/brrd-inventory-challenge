export class ProductCreatedEventRequestDto {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
}