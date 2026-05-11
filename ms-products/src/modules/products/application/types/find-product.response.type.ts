type FindProductResponsePriceHistoryEntry = {
  price: number;
  date: Date;
};

export type FindProductResponse = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  sku: string;
  currency: string;
  priceHistory?: FindProductResponsePriceHistoryEntry[];
};
