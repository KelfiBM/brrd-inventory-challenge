import { EntitySchema } from 'typeorm';
import { StockDbEntity } from './stock.db-entity';

export const StockSchema = new EntitySchema<StockDbEntity>({
  name: 'Stock',
  target: StockDbEntity,
  columns: {
    productId: {
      primary: true,
      type: 'varchar',
      name: 'id',
    },
    productName: {
      type: 'varchar',
      name: 'name',
    },
    stock: {
      type: 'int',
      name: 'stock',
    },
    stockMovements: {
      type: 'json',
      name: 'stockMovements',
    },
    createdAt: {
      type: 'timestamp',
      name: 'created_at',
    },
    updatedAt: {
      type: 'timestamp',
      name: 'updated_at',
    },
  },
  relations: {},
});
