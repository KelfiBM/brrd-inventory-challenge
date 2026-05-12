import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('products')
export class ProductDbEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;
  @Column()
  description: string;
  @Column('decimal')
  price: number;
  @Column()
  currency: string;
  @Column('simple-array')
  categories: string[];
  @Column({'type': 'simple-json', default: '[]'})
  priceHistory: { price: number; changedAt: Date }[];
  @Column()
  @Index({ unique: true })
  sku: string;
  @Column()
  createdAt: Date;
  @Column()
  updatedAt: Date;
}
