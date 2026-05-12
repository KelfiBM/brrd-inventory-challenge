export type FindStockResponse = {
  productId: string;
  productName: string;
  stock: number;
  movementHistory?: {
    quantity: number;
    type: 'IN' | 'OUT';
    date: Date;
  }[];
};
