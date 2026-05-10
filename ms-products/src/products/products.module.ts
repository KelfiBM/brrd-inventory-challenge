import { Module } from '@nestjs/common';
import { ProductsEventController } from './products.event.controller';
import { ProductsHttpController } from './products.http.controller';
import { ProductsService } from './products.service';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { RequestProductCreationUseCase } from './use-cases/request-product-creation.use-case';

const controllers = [ProductsHttpController, ProductsEventController];
const useCases = [RequestProductCreationUseCase, CreateProductUseCase];

@Module({
  controllers: [...controllers],
  providers: [ProductsService, ...useCases],
})
export class ProductsModule {}
