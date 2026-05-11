import { Currency } from '../value-objects/currency.vo';
import { ProductCategory } from '../value-objects/product-category.vo';

export class FindProductsRequestDto {
  currency?: Currency;
  category?: ProductCategory;
}
