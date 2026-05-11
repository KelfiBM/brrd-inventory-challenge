import { Currency } from '../../domain/value-objects/currency.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';

export class FindOneProductRequestDto {
  id: ProductId;
  currency?: Currency;
  includePriceHistory?: boolean;
}
