const stocksRoot = 'stocks';

export const routesV1 = {
  version: 'api',
  stocks: {
    root: stocksRoot,
    getById: `${stocksRoot}/:productId`,
  },
  movements: {
    root: `${stocksRoot}/:productId/movements`,
    create: `${stocksRoot}/:productId/movements`,
  },
};
