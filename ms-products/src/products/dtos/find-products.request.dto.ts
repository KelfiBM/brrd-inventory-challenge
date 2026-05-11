import { Currency } from '../domain/value-objects/currency.vo';
import { ProductCategory } from '../domain/value-objects/product-category.vo';

export class FindProductsRequestDto {
  currency?: Currency;
  category?: ProductCategory;
}
