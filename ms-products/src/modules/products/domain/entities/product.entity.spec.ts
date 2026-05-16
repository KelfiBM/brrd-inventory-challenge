import { Currency } from '../value-objects/currency.vo';
import { Price } from '../value-objects/price.vo';
import { ProductCategory } from '../value-objects/product-category.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { Product } from './product.entity';

describe('Product', () => {
  const validId = new ProductId('test-id-123');
  const validPrice = new Price(100);
  const validCategories = [new ProductCategory('Electronics')];
  const validSku = 'SKU-123';
  const defaultCurrency = new Currency('DOP');

  describe('create', () => {
    it('should create a valid product with required fields', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      expect(product).toBeDefined();
      expect(product.getId()).toEqual(validId);
      expect(product.getName()).toBe('Test Product');
      expect(product.getDescription()).toBe('A test product');
      expect(product.getPrice()).toEqual(validPrice);
      expect(product.getSku()).toBe(validSku);
    });

    it('should throw error when product name is empty', () => {
      expect(() =>
        Product.create({
          id: validId,
          name: '',
          description: 'A test product',
          price: validPrice,
          categories: validCategories,
          sku: validSku,
        })
      ).toThrow('Product name must be a non-empty string');
    });

    it('should throw error when product name is only whitespace', () => {
      expect(() =>
        Product.create({
          id: validId,
          name: '   ',
          description: 'A test product',
          price: validPrice,
          categories: validCategories,
          sku: validSku,
        })
      ).toThrow('Product name must be a non-empty string');
    });

    it('should throw error when SKU is empty', () => {
      expect(() =>
        Product.create({
          id: validId,
          name: 'Test Product',
          description: 'A test product',
          price: validPrice,
          categories: validCategories,
          sku: '',
        })
      ).toThrow('Product SKU must be a non-empty string');
    });

    it('should throw error when categories are empty', () => {
      expect(() =>
        Product.create({
          id: validId,
          name: 'Test Product',
          description: 'A test product',
          price: validPrice,
          categories: [],
          sku: validSku,
        })
      ).toThrow('Product must have at least one category');
    });

    it('should set default currency to DOP when not provided', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      expect(product.getCurrency().getValue()).toBe('DOP');
    });

    it('should use provided currency', () => {
      const usdCurrency = new Currency('USD');
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
        currency: usdCurrency,
      });

      expect(product.getCurrency()).toEqual(usdCurrency);
    });

    it('should initialize price history with current price', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const priceHistory = product.getPriceHistory();
      expect(priceHistory).toHaveLength(1);
      expect(priceHistory[0].price).toEqual(validPrice);
    });

    it('should use provided price history', () => {
      const oldPrice = new Price(50);
      const priceHistory = [{ price: oldPrice, changedAt: new Date('2024-01-01') }];

      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
        priceHistory: priceHistory,
      });

      expect(product.getPriceHistory()).toHaveLength(1);
      expect(product.getPriceHistory()[0].price).toEqual(oldPrice);
    });

    it('should initialize price history when empty array provided', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
        priceHistory: [],
      });

      const priceHistory = product.getPriceHistory();
      expect(priceHistory).toHaveLength(1);
      expect(priceHistory[0].price).toEqual(validPrice);
    });
  });

  describe('updateName', () => {
    it('should update product name', () => {
      const product = Product.create({
        id: validId,
        name: 'Original Name',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const originalUpdatedAt = product.getUpdatedAt();
      product.updateName('Updated Name');

      expect(product.getName()).toBe('Updated Name');
      expect(product.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should throw error when updating to empty name', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      expect(() => product.updateName('')).toThrow('Product name must be a non-empty string');
    });
  });

  describe('updateDescription', () => {
    it('should update product description', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'Original Description',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const originalUpdatedAt = product.getUpdatedAt();
      product.updateDescription('Updated Description');

      expect(product.getDescription()).toBe('Updated Description');
      expect(product.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updatePrice', () => {
    it('should update product price and add to history', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const newPrice = new Price(150);
      product.updatePrice(newPrice);

      expect(product.getPrice()).toEqual(newPrice);
      expect(product.getPriceHistory()).toHaveLength(2);
      expect(product.getPriceHistory()[1].price).toEqual(validPrice);
    });

    it('should update updatedAt timestamp', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const originalUpdatedAt = product.getUpdatedAt();
      product.updatePrice(new Price(200));

      expect(product.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateCategories', () => {
    it('should update product categories', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      const newCategories = [new ProductCategory('Books'), new ProductCategory('Electronics')];
      product.updateCategories(newCategories);

      expect(product.getCategories()).toEqual(newCategories);
      expect(product.getCategories()).toHaveLength(2);
    });

    it('should throw error when updating to empty categories', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
      });

      expect(() => product.updateCategories([])).toThrow('Product must have at least one category');
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const product = Product.create({
        id: validId,
        name: 'Test Product',
        description: 'A test product',
        price: validPrice,
        categories: validCategories,
        sku: validSku,
        currency: defaultCurrency,
      });

      expect(product.getId()).toEqual(validId);
      expect(product.getName()).toBe('Test Product');
      expect(product.getDescription()).toBe('A test product');
      expect(product.getPrice()).toEqual(validPrice);
      expect(product.getCategories()).toEqual(validCategories);
      expect(product.getSku()).toBe(validSku);
      expect(product.getCurrency()).toEqual(defaultCurrency);
      expect(product.getCreatedAt()).toBeInstanceOf(Date);
      expect(product.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });
});
