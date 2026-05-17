import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Currency } from '../../domain/value-objects/currency.vo';
import { Price } from '../../domain/value-objects/price.vo';
import { ProductCategory } from '../../domain/value-objects/product-category.vo';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { CURRENCY_CONVERTER, CurrencyConverterPort } from '../ports/currency-converter.port';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product.repository.port';
import { FindOneProductUseCase } from './find-one-product.use-case';

describe('FindOneProductUseCase', () => {
  let useCase: FindOneProductUseCase;
  let productRepository: ProductRepositoryPort;
  let currencyConverter: CurrencyConverterPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneProductUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: {
            findById: jest.fn(),
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

    useCase = module.get<FindOneProductUseCase>(FindOneProductUseCase);
    productRepository = module.get<ProductRepositoryPort>(PRODUCT_REPOSITORY);
    currencyConverter = module.get<CurrencyConverterPort>(CURRENCY_CONVERTER);
  });

  describe('execute', () => {
    it('should return product when found', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({ id: productId });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Product');
      expect(result.id).toBe('product-123');
      expect(productRepository.findById).toHaveBeenCalledWith(productId, undefined);
    });

    it('should throw ProductNotFoundError when product not found', async () => {
      const productId = new ProductId('non-existent-id');

      jest.spyOn(productRepository, 'findById').mockResolvedValue(null);

      await expect(useCase.execute({ id: productId })).rejects.toThrow(ProductNotFoundError);
    });

    it('should include price history when requested', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({
        id: productId,
        includePriceHistory: true,
      });

      expect(productRepository.findById).toHaveBeenCalledWith(productId, true);
      expect(result.priceHistory).toBeDefined();
    });

    it('should exclude price history by default', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({ id: productId, includePriceHistory: false });

      expect(result.priceHistory).toBeUndefined();
    });

    it('should convert price when currency is provided', async () => {
      const productId = new ProductId('product-123');
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);

      const result = await useCase.execute({
        id: productId,
        currency: targetCurrency,
      });

      expect(result.currency).toBe('USD');
      expect(result.price).toBe(500);
      expect(currencyConverter.convert).toHaveBeenCalled();
    });

    it('should include all product fields in response', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(150.5),
        categories: [new ProductCategory('Electronics'), new ProductCategory('Gadgets')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({ id: productId });

      expect(result).toEqual(
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

    it('should convert price history when currency is provided', async () => {
      const productId = new ProductId('product-123');
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);
      jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);

      const result = await useCase.execute({
        id: productId,
        currency: targetCurrency,
        includePriceHistory: true,
      });

      expect(result.priceHistory).toBeDefined();
    });

    it('should handle product without price history', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({
        id: productId,
        includePriceHistory: false,
      });

      // When includePriceHistory is false, priceHistory should be undefined
      expect(result.priceHistory).toBeUndefined();
    });

    it('should set priceHistory to undefined when includePriceHistory is false', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({
        id: productId,
        includePriceHistory: false,
      });

      expect(result.priceHistory).toBeUndefined();
    });

    it('should correctly map product categories to response', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [
          new ProductCategory('Electronics'),
          new ProductCategory('Gadgets'),
          new ProductCategory('Tech'),
        ],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({ id: productId });

      expect(result.categories).toEqual(['Electronics', 'Gadgets', 'Tech']);
      expect(result.categories).toHaveLength(3);
    });

    it('should pass includePriceHistory parameter to repository', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      await useCase.execute({
        id: productId,
        includePriceHistory: true,
      });

      expect(productRepository.findById).toHaveBeenCalledWith(productId, true);
    });

    it('should convert each price in history independently', async () => {
      const productId = new ProductId('product-123');
      const targetCurrency = new Currency('USD');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(100),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-123',
      });

      const convertSpy = jest.spyOn(currencyConverter, 'convert').mockResolvedValue(500);
      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({
        id: productId,
        currency: targetCurrency,
        includePriceHistory: true,
      });

      // Should be called for main price and each history entry
      expect(convertSpy).toHaveBeenCalled();
    });

    it('should maintain response structure for single category product', async () => {
      const productId = new ProductId('product-123');
      const product = Product.create({
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        price: new Price(99.99),
        categories: [new ProductCategory('Electronics')],
        sku: 'SKU-999',
      });

      jest.spyOn(productRepository, 'findById').mockResolvedValue(product);

      const result = await useCase.execute({ id: productId });

      expect(result).toEqual(
        expect.objectContaining({
          id: productId.getValue(),
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          sku: 'SKU-999',
          categories: ['Electronics'],
        })
      );
    });
  });
});
