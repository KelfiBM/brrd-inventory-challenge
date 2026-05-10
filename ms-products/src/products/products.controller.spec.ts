import { Test, TestingModule } from '@nestjs/testing';
import { ProductsHttpController } from './products.http.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsHttpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsHttpController],
      providers: [ProductsService],
    }).compile();

    controller = module.get<ProductsHttpController>(ProductsHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
