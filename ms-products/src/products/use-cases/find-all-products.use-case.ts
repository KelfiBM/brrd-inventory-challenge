import { Inject, Injectable } from '@nestjs/common';
import { FindProductResponseDto } from '../dtos/find-product.response.dto';
import { FindProductsRequestDto } from '../dtos/find-products.request.dto';
import { Product } from '../entities/product.entity';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { Currency } from '../value-objects/currency.vo';
import { Price } from '../value-objects/price.vo';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort
  ) {}

  async execute(findProductsRequestDto: FindProductsRequestDto): Promise<FindProductResponseDto[]> {
    const products = await this.findProducts(findProductsRequestDto);

    if (findProductsRequestDto.currency) {
      return this.convertCurrency(products, findProductsRequestDto.currency);
    }

    return products.map((product) => this.mapResponse(product));
  }

  private async findProducts(findProductsRequestDto: FindProductsRequestDto): Promise<Product[]> {
    if (findProductsRequestDto.category) {
      return this.productRepository.findByCategory(findProductsRequestDto.category);
    }
    return this.productRepository.findAll();
  }

  private mapResponse(
    product: Product,
    currency?: Currency,
    price?: Price
  ): FindProductResponseDto {
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
  ): Promise<FindProductResponseDto[]> {
    return await Promise.all(
      products.map(async (product): Promise<FindProductResponseDto> => {
        return this.mapResponse(
          product,
          targetCurrency,
          await this.convertPrice(product.getPrice(), product.getCurrency(), targetCurrency)
        );
      })
    );
  }

  private async convertPrice(
    price: Price,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<Price> {
    const convertedValue = await this.currencyConverter.convert(
      price.getValue(),
      fromCurrency,
      toCurrency
    );
    return new Price(convertedValue);
  }
}
