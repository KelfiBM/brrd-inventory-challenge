export const CommandNames = {
  CREATE_STOCK_MOVEMENT: 'c.stock-movements.create',
};

export const DomainEventNames = {
  STOCK_CREATED: 'e.stocks.created',
  STOCK_UPDATED: 'e.stocks.updated',
  STOCK_DELETED: 'e.stocks.deleted',

  PRODUCT_CREATED: 'e.products.created',
  PRODUCT_UPDATED: 'e.products.updated',
  PRODUCT_DELETED: 'e.products.deleted',
};

export const CacheKeys = {
  STOCK: (productId: string) => `stocks:${productId}`,
};
