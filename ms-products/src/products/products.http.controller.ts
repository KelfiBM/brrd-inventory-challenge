import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { routesV1 } from '../configs/app.routes';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import { FindProductsResponseDto } from './dtos/find-products.response.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { UpdateProductRequestDto } from './dtos/update-product.request.dto';
import { FindAllProductsUseCase } from './use-cases/find-all-products.use-case';
import { RequestProductCreationUseCase } from './use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './use-cases/request-product-update.use-case';
import { Currency } from './value-objects/currency.vo';
import { ProductCategory } from './value-objects/product-category.vo';

@Controller(routesV1.version)
export class ProductsHttpController {
  constructor(
    private readonly requestProductCreationUseCase: RequestProductCreationUseCase,
    private readonly requestProductUpdateUseCase: RequestProductUpdateUseCase,
    private readonly requestProductDeletionUseCase: RequestProductDeletionUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase
  ) {}

  @Post(routesV1.products.root)
  async requestCreate(
    @Body() createProductRequestDto: CreateProductRequestDto
  ): Promise<IdResponseDto> {
    const productId = await this.requestProductCreationUseCase.execute(createProductRequestDto);
    return { id: productId.getValue(), message: 'Product creation requested successfully' };
  }

  @Patch(routesV1.products.update)
  async updateRequest(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductRequestDto
  ): Promise<IdResponseDto> {
    const productId = await this.requestProductUpdateUseCase.execute(id, updateProductDto);
    return { id: productId.getValue(), message: 'Product update requested successfully' };
  }

  @Delete(routesV1.products.delete)
  async removeRequest(@Param('id') id: string) {
    const productId = await this.requestProductDeletionUseCase.execute(id);
    return { id: productId.getValue(), message: 'Product deletion requested successfully' };
  }

  @Get(routesV1.products.root)
  async findAllRequest(
    @Query('currency') currency?: string,
    @Query('category') category?: string
  ): Promise<FindProductsResponseDto[]> {
    const products = await this.findAllProductsUseCase.execute({
      currency: currency ? new Currency(currency) : undefined,
      category: category ? new ProductCategory(category) : undefined,
    });
    return products;
  }

  @Get(':id')
  findOneRequest(@Param('id') id: string) {
    throw new Error('Method not implemented yet');
  }
}
