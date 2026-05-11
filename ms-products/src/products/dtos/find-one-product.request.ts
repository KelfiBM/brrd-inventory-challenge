import { Currency } from '../value-objects/currency.vo';
import { ProductId } from '../value-objects/product-id.vo';

export class FindOneProductRequestDto {
  id: ProductId;
  currency?: Currency;
  includePriceHistory?: boolean;
}
