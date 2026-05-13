import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { routesV1 } from '../../../configs/app.routes';
import { FindAllProductsUseCase } from '../application/use-cases/find-all-products.use-case';
import { FindOneProductUseCase } from '../application/use-cases/find-one-product.use-case';
import { RequestProductCreationUseCase } from '../application/use-cases/request-product-creation.use-case';
import { RequestProductDeletionUseCase } from '../application/use-cases/request-product-deletion.use-case';
import { RequestProductUpdateUseCase } from '../application/use-cases/request-product-update.use-case';
import { DuplicatedProductError } from '../domain/errors/duplicated-product.error';
import { ProductNotChangedError } from '../domain/errors/product-not-changed.error';
import { ProductNotFoundError } from '../domain/errors/product-not-found.error';
import { Currency } from '../domain/value-objects/currency.vo';
import { Price } from '../domain/value-objects/price.vo';
import { ProductCategory } from '../domain/value-objects/product-category.vo';
import { ProductId } from '../domain/value-objects/product-id.vo';
import { Roles } from './decorators/usre-role.decorator';
import { CreateProductRequestDto } from './dtos/create-product.request.dto';
import { FindProductResponseDto } from './dtos/find-product.response.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { UpdateProductRequestDto } from './dtos/update-product.request.dto';
import { Role } from './enum/role.enum';
import { AuthGuard } from './guards/auth.guard';
import { HttpResponseInterceptor } from './interceptors/http-response.interceptor';
import { ProductIdempotencyInterceptor } from './interceptors/product-idempotency.interceptor';

@Controller(routesV1.version)
@UseGuards(AuthGuard)
@UseInterceptors(HttpResponseInterceptor)
export class ProductsHttpController {
  constructor(
    private readonly requestProductCreationUseCase: RequestProductCreationUseCase,
    private readonly requestProductUpdateUseCase: RequestProductUpdateUseCase,
    private readonly requestProductDeletionUseCase: RequestProductDeletionUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findOneProductUseCase: FindOneProductUseCase
  ) {}

  @UseInterceptors(ProductIdempotencyInterceptor)
  @Roles(Role.Admin)
  @Post(routesV1.products.root)
  async requestCreate(
    @Body() createProductRequestDto: CreateProductRequestDto
  ): Promise<IdResponseDto> {
    try {
      const productId = await this.requestProductCreationUseCase.execute({
        ...createProductRequestDto,
        price: new Price(createProductRequestDto.price),
        categories: createProductRequestDto.categories.map((cat) => new ProductCategory(cat)),
      });
      return { id: productId.getValue(), message: 'Product creation requested successfully' };
    } catch (error) {
      if (error instanceof DuplicatedProductError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @UseInterceptors(ProductIdempotencyInterceptor)
  @Roles(Role.Admin)
  @Patch(routesV1.products.update)
  async updateRequest(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductRequestDto
  ): Promise<IdResponseDto> {
    try {
      const productId = await this.requestProductUpdateUseCase.execute({
        id: new ProductId(id),
        name: updateProductDto.name,
        description: updateProductDto.description,
        price: updateProductDto.price ? new Price(updateProductDto.price) : undefined,
        categories: updateProductDto.categories
          ? updateProductDto.categories.map((cat) => new ProductCategory(cat))
          : undefined,
      });
      return { id: productId.getValue(), message: 'Product update requested successfully' };
    } catch (error) {
      if (error instanceof ProductNotChangedError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @UseInterceptors(ProductIdempotencyInterceptor)
  @Roles(Role.Admin)
  @Delete(routesV1.products.delete)
  async removeRequest(@Param('id') id: string) {
    try {
      const productId = await this.requestProductDeletionUseCase.execute({ id: new ProductId(id) });
      return { id: productId.getValue(), message: 'Product deletion requested successfully' };
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(routesV1.products.root)
  async findAllRequest(
    @Query('currency') currency?: string,
    @Query('category') category?: string
  ): Promise<FindProductResponseDto[]> {
    const products = await this.findAllProductsUseCase.execute({
      currency: currency ? new Currency(currency) : undefined,
      category: category ? new ProductCategory(category) : undefined,
    });
    return products.map(
      (product): FindProductResponseDto => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        categories: product.categories,
        sku: product.sku,
        currency: product.currency,
      })
    );
  }

  @Get(routesV1.products.getById)
  async findOneRequest(
    @Param('id') id: string,
    @Query('priceHistory', new ParseBoolPipe({ optional: true })) priceHistory?: boolean,
    @Query('currency') currency?: string
  ): Promise<FindProductResponseDto> {
    try {
      const product = await this.findOneProductUseCase.execute({
        id: new ProductId(id),
        currency: currency ? new Currency(currency) : undefined,
        includePriceHistory: priceHistory ?? false,
      });
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        categories: product.categories,
        sku: product.sku,
        currency: product.currency,
        priceHistory: product.priceHistory,
      };
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
