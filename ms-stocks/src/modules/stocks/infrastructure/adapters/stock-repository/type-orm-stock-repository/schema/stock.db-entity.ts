export class StockDbEntity {
  productId: string;
  productName: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
  stockMovements: any[];
}
