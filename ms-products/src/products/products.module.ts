import { Module } from '@nestjs/common';
import { ProductsEventController } from './products.event.controller';
import { ProductsHttpController } from './products.http.controller';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { DeleteProductUseCase } from './use-cases/delete-product.use-case';
import { RequestProductCreationUseCase } from './use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './use-cases/request-product-update.use-case';
import { UpdateCacheUseCase } from './use-cases/update-cache.use-case';
import { UpdateProductUseCase } from './use-cases/update-product.use-case';

const controllers = [ProductsHttpController, ProductsEventController];
const useCases = [
  RequestProductCreationUseCase,
  RequestProductUpdateUseCase,
  RequestProductDeletionUseCase,
  CreateProductUseCase,
  DeleteProductUseCase,
  UpdateProductUseCase,
  UpdateCacheUseCase,
];

@Module({
  controllers: [...controllers],
  providers: [...useCases],
})
export class ProductsModule {}
