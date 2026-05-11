import { EntitySchema } from 'typeorm';
import { Product } from '../../../../../domain/entities/product.entity';

export const ProductSchema = new EntitySchema<Product>({
  name: 'Product',
  target: Product,
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
    getDescription: {
      type: 'text',
      name: 'description',
    },
    getPrice: {
      type: 'decimal',
      name: 'price',
    },
    getCurrency: {
      type: 'varchar',
      name: 'currency',
    },
    getCategories: {
      type: 'simple-array',
      name: 'categories',
    },
    getSku: {
      type: 'varchar',
      name: 'sku',
    },
    getPriceHistory: {
      type: 'simple-json',
      name: 'price_history',
    },
  },
  relations: {},
});
