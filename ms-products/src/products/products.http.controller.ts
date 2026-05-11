import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { routesV1 } from '../configs/app.routes';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { UpdateProductRequestDto } from './dtos/update-product.request.dto';
import { ProductsService } from './products.service';
import { RequestProductCreationUseCase } from './use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from './use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from './use-cases/request-product-update.use-case';

@Controller(routesV1.version)
export class ProductsHttpController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly requestProductCreationUseCase: RequestProductCreationUseCase,
    private readonly requestProductUpdateUseCase: RequestProductUpdateUseCase,
    private readonly requestProductDeletionUseCase: RequestProductDeletionUseCase
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

  @Get()
  findAllRequest() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOneRequest(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }
}
