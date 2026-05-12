export class FindStockResponseDto {
  data: {
    productId: string;
    productName?: string;
    stock?: number;
    movementHistory?: {
      quantity: number;
      type: 'IN' | 'OUT';
      date: Date;
    }[];
  };
}
