import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CommandNames } from '../configs/app.command-names';
import { routesV1 } from '../configs/app.routes';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { ProductsService } from './products.service';

@Controller(routesV1.version)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post(routesV1.products.root)
  async requestCreate(
    @Body() createProductRequestDto: CreateProductRequestDto
  ): Promise<IdResponseDto> {
    const productId = await this.productsService.requestCreation(createProductRequestDto);
    return { id: productId.getValue() };
  }

  @EventPattern(CommandNames.CREATE_PRODUCT)
  handleProductRequestCreation(@Payload() createProductCommand: CreateProductCommand) {
    throw new Error('Method not implemented.');
  }

  @MessagePattern('findAllProducts')
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern('findOneProduct')
  findOne(@Payload() id: number) {
    return this.productsService.findOne(id);
  }

  @MessagePattern('updateProduct')
  update(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.update(updateProductDto.id, updateProductDto);
  }

  @MessagePattern('removeProduct')
  remove(@Payload() id: number) {
    return this.productsService.remove(id);
  }

  @Get()
  findAllRequest() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOneRequest(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  updateRequest(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  removeRequest(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
