import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../domain/entities/product.entity';
import { Currency } from '../../domain/value-objects/currency.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { FindAllProductsUseCase } from './find-all-products.use-case';

describe('FindAllProductsUseCase', () => {
  let useCase: FindAllProductsUseCase;
  let productRepository: ProductRepositoryPort;
  let currencyConverter: CurrencyConverterPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllProductsUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findByCategory: jest.fn(),
          },
        },
        {
          provide: CURRENCY_CONVERTER,
          useValue: {
            convert: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<FindAllProductsUseCase>(FindAllProductsUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    currencyConverter = module.get<CurrencyConverterPort>(CURRENCY_CONVERTER);
  });

  describe('execute', () => {
    it('should return all products without currency conversion', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product]);

      const result = await useCase.execute({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].price).toBe(100);
      expect(productRepository.findAll).toHaveBeenCalled();
    });

    it('should find products by category', async () => {
      const category = new ProductCategory('Electronics');
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [category],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findByCategory').mockResolvedValue([product]);

      const result = await useCase.execute({ category });

      expect(result).toHaveLength(1);
      expect(productRepository.findByCategory).toHaveBeenCalledWith(category);
    });

    it('should convert prices when currency is provided', async () => {
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product]);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);

      const result = await useCase.execute({ currency: targetCurrency });

      expect(result).toHaveLength(1);
      expect(result[0].currency).toBe('USD');
      expect(currencyConverter.convert).toHaveBeenCalled();
    });

    it('should use default currency when currency conversion not requested', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
        currency: new Currency('DOP'),
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product]);

      const result = await useCase.execute({});

      expect(result[0].currency).toBe('DOP');
      expect(currencyConverter.convert).not.toHaveBeenCalled();
    });

    it('should return empty array when no products found', async () => {
      jest.spyOn(productRepository, 'findAll').mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result).toHaveLength(0);
    });

    it('should include all product fields in response', async () => {
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(150.5),
        categories: [new ProductCategory('Electronics'), new ProductCategory('Gadgets')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product]);

      const result = await useCase.execute({});

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'product-123',
          name: 'Test Product',
          description: 'A test product',
          price: 150.5,
          sku: 'SKU-123',
          categories: expect.arrayContaining(['Electronics', 'Gadgets']),
        })
      );
    });

    it('should handle multiple products without currency conversion', async () => {
      const product1 = Product.create({
        id: new ProductId('product-1'),
        name: 'Product 1',
        description: 'Description 1',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-001',
      });

      const product2 = Product.create({
        id: new ProductId('product-2'),
        name: 'Product 2',
        description: 'Description 2',
        price: new Price(200),
        categories: [new ProductCategory('Books')],
        sku: 'SKU-002',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product1, product2]);

      const result = await useCase.execute({});

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
      expect(result[1].name).toBe('Product 2');
    });

    it('should convert currency for multiple products', async () => {
      const targetCurrency = new Currency('USD');
      const product1 = Product.create({
        id: new ProductId('product-1'),
        name: 'Product 1',
        description: 'Description 1',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-001',
      });

      const product2 = Product.create({
        id: new ProductId('product-2'),
        name: 'Product 2',
        description: 'Description 2',
        price: new Price(200),
        categories: [new ProductCategory('Books')],
        sku: 'SKU-002',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product1, product2]);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);

      const result = await useCase.execute({ currency: targetCurrency });

      expect(result).toHaveLength(2);
      expect(result[0].currency).toBe('USD');
      expect(result[1].currency).toBe('USD');
      expect(currencyConverter.convert).toHaveBeenCalled();
    });

    it('should find products by category and convert currency', async () => {
      const category = new ProductCategory('Electronics');
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [category],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findByCategory').mockResolvedValue([product]);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);

      const result = await useCase.execute({ category, currency: targetCurrency });

      expect(result).toHaveLength(1);
      expect(result[0].currency).toBe('USD');
      expect(productRepository.findByCategory).toHaveBeenCalledWith(category);
    });

    it('should handle empty result from findAll', async () => {
      jest.spyOn(productRepository, 'findAll').mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle empty result from findByCategory', async () => {
      const category = new ProductCategory('NonExistent');
      jest.spyOn(productRepository, 'findByCategory').mockResolvedValue([]);

      const result = await useCase.execute({ category });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should maintain product fields in response with currency conversion', async () => {
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: new ProductId('product-123'),
        name: 'Test Product',
        description: 'A test product',
        price: new Price(150),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-456',
      });

      jest.spyOn(productRepository, 'findAll').mockResolvedValue([product]);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(750);

      const result = await useCase.execute({ currency: targetCurrency });

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'product-123',
          name: 'Test Product',
          description: 'A test product',
          price: 750,
          sku: 'SKU-456',
          currency: 'USD',
          categories: ['Electronics'],
        })
      );
    });
  });
});
