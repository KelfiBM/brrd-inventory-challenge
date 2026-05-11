import { Currency } from '../value-objects/currency.vo';

export interface CurrencyConverterPort {
  convert(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number>;
}

export const CURRENCY_CONVERTER = Symbol('CURRENCY_CONVERTER');
