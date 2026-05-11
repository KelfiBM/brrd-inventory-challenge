import { Inject, Injectable, Optional } from '@nestjs/common';
import { FindProductsRequestDto } from '../dtos/find-products.request.dto';
import { FindProductsResponseDto } from '../dtos/find-products.response.dto';
import { Product } from '../entities/product.entity';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_CACHE_REPOSITORY } from '../ports/product.cache-repository.port';
import { PRODUCT_LOGGER, ProductLoggerPort } from '../ports/product.logger.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { Currency } from '../value-objects/currency.vo';
import { Price } from '../value-objects/price.vo';
import { ProductCategory } from '../value-objects/product-category.vo';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort,

    @Optional()
    @Inject(PRODUCT_LOGGER)
    private readonly logger?: ProductLoggerPort,

    @Optional()
    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly productCacheRepository?: ProductRepositoryPort
  ) {}

  async execute(
    findProductsRequestDto: FindProductsRequestDto
  ): Promise<FindProductsResponseDto[]> {
    const products = await this.findProducts(findProductsRequestDto);

    if (findProductsRequestDto.currency) {
      return this.convertCurrency(products, findProductsRequestDto.currency);
    }

    return products.map((product) => this.mapResponse(product));
  }

  private async findProducts(findProductsRequestDto: FindProductsRequestDto): Promise<Product[]> {
    if (findProductsRequestDto.category) {
      return this.findProductsByCategory(findProductsRequestDto.category);
    }
    return this.findAllProducts();
  }

  private async findAllProducts(): Promise<Product[]> {
    const products = this.productCacheRepository ? await this.productCacheRepository.findAll() : [];

    if (products && products.length > 0) {
      this.logger?.verbose('Products retrieved from cache');
      return products;
    }

    const productsFromRepo = await this.productRepository.findAll();

    try {
      if (this.productCacheRepository) {
        await this.productCacheRepository.saveAll(productsFromRepo);
      }
    } catch (error) {
      this.logger?.error('Failed to cache products', error);
    }

    this.logger?.verbose('Products retrieved from repository and cached');
    return productsFromRepo;
  }

  private async findProductsByCategory(category: ProductCategory): Promise<Product[]> {
    const products = this.productCacheRepository
      ? await this.productCacheRepository.findByCategory(category)
      : [];

    if (products && products.length > 0) {
      this.logger?.verbose(`Products for category ${category.getValue()} retrieved from cache`);
      return products;
    }

    const productsFromRepo = await this.productRepository.findByCategory(category);

    try {
      if (this.productCacheRepository) {
        await this.productCacheRepository.saveByCategory(category, productsFromRepo);
      }
    } catch (error) {
      this.logger?.error(`Failed to cache products for category ${category.getValue()}`, error);
    }

    this.logger?.verbose(
      `Products for category ${category.getValue()} retrieved from repository and cached`
    );
    return productsFromRepo;
  }

  private mapResponse(
    product: Product,
    currency?: Currency,
    price?: Price
  ): FindProductsResponseDto {
    return {
      currency: currency ? currency.getValue() : product.getCurrency().getValue(),
      sku: product.getSku(),
      categories: product.getCategories().map((product) => product.getValue()),
      name: product.getName(),
      id: product.getId().getValue(),
      description: product.getDescription(),
      price: price ? price.getValue() : product.getPrice().getValue(),
    };
  }

  private async convertCurrency(
    products: Product[],
    targetCurrency: Currency
  ): Promise<FindProductsResponseDto[]> {
    return await Promise.all(
      products.map(async (product): Promise<FindProductsResponseDto> => {
        return this.mapResponse(
          product,
          targetCurrency,
          new Price(
            await this.currencyConverter.convert(
              product.getPrice().getValue(),
              product.getCurrency(),
              targetCurrency
            )
          )
        );
      })
    );
  }
}
