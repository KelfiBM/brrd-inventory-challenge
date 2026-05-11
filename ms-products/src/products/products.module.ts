import { Module } from '@nestjs/common';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { FindAllProductsUseCase } from './application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from './application/use-cases/find-one-product.use-case';
import { RequestProductCreationUseCase } from './application/use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './application/use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './application/use-cases/request-product-update.use-case';
import { InvalidateCacheUseCase } from './application/use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ProductsEventController } from './products.event.controller';
import { ProductsHttpController } from './products.http.controller';

const controllers = [ProductsHttpController, ProductsEventController];
const useCases = [
  RequestProductCreationUseCase,
  RequestProductUpdateUseCase,
  RequestProductDeletionUseCase,
  CreateProductUseCase,
  DeleteProductUseCase,
  UpdateProductUseCase,
  InvalidateCacheUseCase,
  FindAllProductsUseCase,
  FindOneProductUseCase,
];

@Module({
  controllers: [...controllers],
  providers: [...useCases],
})
export class ProductsModule {}
