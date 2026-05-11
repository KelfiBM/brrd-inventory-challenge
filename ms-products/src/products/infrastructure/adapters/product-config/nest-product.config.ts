import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ProductConfigPort } from '../../../application/ports/product.config.port';
import productsConfig from '../../../products.config';

@Injectable()
export class NestProductConfig implements ProductConfigPort {
  constructor(
    @Inject(productsConfig.KEY)
    private readonly productConfig: ConfigType<typeof productsConfig>
  ) {
    this.defaultCurrency = this.productConfig.defaultCurrency;
  }
  defaultCurrency: string;
}
