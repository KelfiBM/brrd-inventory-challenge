import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { routesV1 } from '../configs/app.routes';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { ProductsService } from './products.service';
import { RequestProductCreationUseCase } from './use-cases/request-product-creation.use-case';

@Controller(routesV1.version)
export class ProductsHttpController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly requestProductCreationUseCase: RequestProductCreationUseCase
  ) {}

  @Post(routesV1.products.root)
  async requestCreate(
    @Body() createProductRequestDto: CreateProductRequestDto
  ): Promise<IdResponseDto> {
    const productId = await this.requestProductCreationUseCase.execute(createProductRequestDto);
    return { id: productId.getValue() };
  }

  @Get()
  findAllRequest() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOneRequest(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // @Patch(':id')
  // updateRequest(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  //   return this.productsService.update(+id, updateProductDto);
  // }

  @Delete(':id')
  removeRequest(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
