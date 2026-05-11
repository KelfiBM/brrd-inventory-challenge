const productsRoot = 'products';

export const routesV1 = {
  version: 'api',
  products: {
    root: productsRoot,
    update: `${productsRoot}/:id`,
    delete: `${productsRoot}/:id`,
  },
};
