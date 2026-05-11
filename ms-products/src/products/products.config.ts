import { registerAs } from '@nestjs/config';

type ProductsConfig = {
  defaultCurrency: string;
};

export default registerAs(
  'products',
  (): ProductsConfig => ({
    defaultCurrency: process.env.PRODUCTS_DEFAULT_CURRENCY || 'DOP',
  })
);
