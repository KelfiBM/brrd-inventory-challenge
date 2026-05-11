import { registerAs } from '@nestjs/config';
import Joi from 'joi';

type ProductsConfig = {
  defaultCurrency: string;
  exchangeRateApiUrl: string;
  exchangeRateApiKey: string;
};

export default registerAs('products', (): ProductsConfig => {
  const productsConfigSchema = Joi.object({
    PRODUCTS_DEFAULT_CURRENCY: Joi.string().default('DOP'),
    EXCHANGE_RATE_API_URL: Joi.string().uri().required(),
    EXCHANGE_RATE_API_KEY: Joi.string().required(),
  });

  const { error, value: envVars } = productsConfigSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    console.error(`Config validation error: ${error.message}`);
    error.details.forEach((detail) => {
      console.error(` - ${detail.message} (at ${detail.path.join('.')})`);
    });
    throw new Error(`Config validation error: ${error.message}`);
  }

  const values: ProductsConfig = {
    defaultCurrency: envVars.PRODUCTS_DEFAULT_CURRENCY,
    exchangeRateApiUrl: envVars.EXCHANGE_RATE_API_URL,
    exchangeRateApiKey: envVars.EXCHANGE_RATE_API_KEY,
  };
  return values;
});
