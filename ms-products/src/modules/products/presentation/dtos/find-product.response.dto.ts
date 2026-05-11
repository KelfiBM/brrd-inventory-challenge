type FindProductResponsePriceHistoryEntry = {
  price: number;
  date: Date;
};

export class FindProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
  currency: string;
  priceHistory?: FindProductResponsePriceHistoryEntry[];
}
