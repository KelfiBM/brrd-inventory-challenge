import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { Currency } from '../../domain/value-objects/currency.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { FindProductResponse } from '../types/find-product.response.type';

type FindOneProductRequestDto = {
  id: ProductId;
  currency?: Currency;
  includePriceHistory?: boolean;
};

@Injectable()
export class FindOneProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CURRENCY_CONVERTER)
    private readonly currencyConverter: CurrencyConverterPort
  ) {}

  async execute(findOneProductRequestDto: FindOneProductRequestDto): Promise<FindProductResponse> {
    const product = await this.findProduct(findOneProductRequestDto);

    if (findOneProductRequestDto.currency) {
      return this.convertCurrency(product, findOneProductRequestDto.currency);
    }

    const response = this.mapResponse(product);
    if (!findOneProductRequestDto.includePriceHistory) {
      response.priceHistory = undefined;
    }
    return response;
  }

  private async findProduct(findOneProductRequestDto: FindOneProductRequestDto): Promise<Product> {
    const product = await this.productRepository.findById(
      findOneProductRequestDto.id,
      findOneProductRequestDto.includePriceHistory
    );
    if (!product) {
      throw new Error(`Product with ID ${findOneProductRequestDto.id.getValue()} not found`);
    }

    return product;
  }

  private mapResponse(
    product: Product,
    currency?: Currency,
    price?: Price,
    priceHistory?: { price: Price; date: Date }[]
  ): FindProductResponse {
    const categories = product.getCategories().map((category) => category.getValue());
    const priceValue = price ? price.getValue() : product.getPrice().getValue();
    const currencyValue = currency ? currency.getValue() : product.getCurrency().getValue();

    const priceHistoryEntries = priceHistory
      ? priceHistory.map((entry) => ({
          price: entry.price.getValue(),
          date: entry.date,
        }))
      : product.getPriceHistory().map((entry) => ({
          price: entry.price.getValue(),
          date: entry.changedAt,
        }));
    const hasPriceHistory = priceHistoryEntries.length > 0;

    return {
      currency: currencyValue,
      sku: product.getSku(),
      categories: categories,
      name: product.getName(),
      id: product.getId().getValue(),
      description: product.getDescription(),
      price: priceValue,
      priceHistory: hasPriceHistory ? priceHistoryEntries : undefined,
    };
  }

  private async convertCurrency(
    product: Product,
    targetCurrency: Currency
  ): Promise<FindProductResponse> {
    const mainPrice = new Price(
      await this.currencyConverter.convert(
        product.getPrice().getValue(),
        product.getCurrency(),
        targetCurrency
      )
    );

    const priceHistory = await Promise.all(
      product.getPriceHistory().map(async (entry) => ({
        price: await this.convertPrice(entry.price, product.getCurrency(), targetCurrency),
        date: entry.changedAt,
      }))
    );

    return this.mapResponse(product, targetCurrency, mainPrice, priceHistory);
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
