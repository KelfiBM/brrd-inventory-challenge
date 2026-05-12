import { EntitySchema } from 'typeorm';
import { Stock } from '../../../../../domain/entities/stock.entity';

export const StockSchema = new EntitySchema<Stock>({
  name: 'Stock',
  target: Stock,
  columns: {
    getId: {
      primary: true,
      type: 'varchar',
      name: 'id',
    },
    getName: {
      type: 'varchar',
      name: 'name',
    },
    getStock: {
      type: 'int',
      name: 'stock',
    },
    getMovements: {
      type: 'json',
      name: 'stockMovements',
    },
    getCreatedAt: {
      type: 'timestamp',
      name: 'created_at',
    },
    getUpdatedAt: {
      type: 'timestamp',
      name: 'updated_at',
    },
  },
  relations: {},
});
