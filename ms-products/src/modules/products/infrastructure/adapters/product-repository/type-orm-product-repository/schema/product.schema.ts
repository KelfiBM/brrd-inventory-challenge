import { EntitySchema } from 'typeorm';
import { ProductDbEntity } from './product.db-entity';

export const ProductSchema = new EntitySchema<ProductDbEntity>({
  name: 'Product',
  target: ProductDbEntity,
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      name: 'id',
    },
    name: {
      type: 'varchar',
      name: 'name',
    },
    description: {
      type: 'text',
      name: 'description',
    },
    price: {
      type: 'decimal',
      name: 'price',
    },
    currency: {
      type: 'varchar',
      name: 'currency',
    },
    categories: {
      type: 'simple-array',
      name: 'categories',
    },
    sku: {
      type: 'varchar',
      name: 'sku',
    },
    priceHistory: {
      type: 'simple-json',
      name: 'price_history',
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
