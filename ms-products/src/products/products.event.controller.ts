import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandNames } from '../configs/app.command-names';
import { routesV1 } from '../configs/app.routes';
import { CreateProductCommand } from './commands/create-product.command';
import { CreateProductUseCase } from './use-cases/create-product.use-case';

@Controller(routesV1.version)
export class ProductsEventController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  @EventPattern(CommandNames.CREATE_PRODUCT)
  async handleCreateProductCommand(@Payload() createProductCommand: CreateProductCommand) {
    await this.createProductUseCase.execute(createProductCommand);
  }

  // @MessagePattern('findAllProducts')
  // findAll() {
  //   return this.productsService.findAll();
  // }

  // @MessagePattern('findOneProduct')
  // findOne(@Payload() id: number) {
  //   return this.productsService.findOne(id);
  // }

  // // @MessagePattern('updateProduct')
  // // update(@Payload() updateProductDto: UpdateProductDto) {
  // //   return this.productsService.update(updateProductDto.id, updateProductDto);
  // // }

  // @MessagePattern('removeProduct')
  // remove(@Payload() id: number) {
  //   return this.productsService.remove(id);
  // }

  // @Get()
  // findAllRequest() {
  //   return this.productsService.findAll();
  // }

  // @Get(':id')
  // findOneRequest(@Param('id') id: string) {
  //   return this.productsService.findOne(+id);
  // }

  // // @Patch(':id')
  // // updateRequest(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  // //   return this.productsService.update(+id, updateProductDto);
  // // }

  // @Delete(':id')
  // removeRequest(@Param('id') id: string) {
  //   return this.productsService.remove(+id);
  // }
}
