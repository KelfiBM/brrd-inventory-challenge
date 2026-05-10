import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommand } from './commands/create-product.command';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import {
  PRODUCT_COMMAND_EMITTER,
  ProductCommandEmitterPort,
} from './ports/product.command-emitter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from './ports/product.repository.port';
import { ProductId } from './value-objects/product-id.vo';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(PRODUCT_COMMAND_EMITTER)
    private readonly productCommandEmitter: ProductCommandEmitterPort
  ) {}

  async requestCreation(requestProductCreationDto: CreateProductRequestDto): Promise<ProductId> {
    const nextProductId = await this.productRepository.getNextId();
    const createProductCommand = new CreateProductCommand(
      nextProductId,
      requestProductCreationDto.name,
      requestProductCreationDto.description,
      requestProductCreationDto.price,
      requestProductCreationDto.categories,
      requestProductCreationDto.sku
    );
    await this.productCommandEmitter.emitCreateProductCommand(createProductCommand);
    return new ProductId(nextProductId);
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
