export const CommandNames = {
  CREATE_PRODUCT: 'c.products.create',
  UPDATE_PRODUCT: 'c.products.update',
  DELETE_PRODUCT: 'c.products.delete',
};

export const DomainEventNames = {
  PRODUCT_CREATED: 'e.products.created',
  PRODUCT_UPDATED: 'e.products.updated',
  PRODUCT_DELETED: 'e.products.deleted',
};

export const CacheKeys = {
  ALL_PRODUCTS: 'products:all',
  PRODUCTS_BY_CATEGORY: (category: string) => `products:category:${category}`,
  PRODUCT_BY_ID: (id: string) => `product:id:${id}`,
  EXCHANGE_RATES: (baseCurrency: string) => `exchangeRates:base:${baseCurrency}`,
};
