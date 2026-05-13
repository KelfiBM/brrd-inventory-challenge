import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('stocks')
export class StockDbEntity {
  @PrimaryColumn()
  productId: string;

  @Column()
  productName: string;
  @Column()
  stock: number;
  @Column()
  createdAt: Date;
  @Column()
  updatedAt: Date;
  @Column({ type: 'simple-json', default: '[]' })
  stockMovements: { quantity: number; type: string; date: Date }[];
}
