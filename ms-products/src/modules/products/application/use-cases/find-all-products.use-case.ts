import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { Currency } from '../../domain/value-objects/currency.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { FindProductResponse } from '../types/find-product.response.type';

type FindAllProductsRequestDto = {
  currency?: Currency;
  category?: ProductCategory;
};

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort
  ) {}

  async execute(
    findAllProductsRequestDto: FindAllProductsRequestDto
  ): Promise<FindProductResponse[]> {
    const products = await this.findProducts(findAllProductsRequestDto);

    if (findAllProductsRequestDto.currency) {
      return this.convertCurrency(products, findAllProductsRequestDto.currency);
    }

    return products.map((product) => this.mapResponse(product));
  }

  private async findProducts(
    findAllProductsRequestDto: FindAllProductsRequestDto
  ): Promise<Product[]> {
    if (findAllProductsRequestDto.category) {
      return this.productRepository.findByCategory(findAllProductsRequestDto.category);
    }
    return this.productRepository.findAll();
  }

  private mapResponse(product: Product, currency?: Currency, price?: Price): FindProductResponse {
    return {
      currency: currency ? currency.getValue() : product.getCurrency().getValue(),
      sku: product.getSku(),
      categories: product.getCategories().map((category) => category.getValue()),
      name: product.getName(),
      id: product.getId().getValue(),
      description: product.getDescription(),
      price: price ? price.getValue() : product.getPrice().getValue(),
    };
  }

  private async convertCurrency(
    products: Product[],
    targetCurrency: Currency
  ): Promise<FindProductResponse[]> {
    return await Promise.all(
      products.map(async (product): Promise<FindProductResponse> => {
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
