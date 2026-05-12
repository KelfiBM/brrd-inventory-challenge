import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Like, Repository } from 'typeorm';
import {
  PRODUCT_CACHE_REPOSITORY,
  ProductCacheRepositoryPort,
} from '../../../../application/ports/product.cache-repository.port';
import { ProductRepositoryPort } from '../../../../application/ports/product.repository.port';
import { Product } from '../../../../domain/entities/product.entity';
import { Currency } from '../../../../domain/value-objects/currency.vo';
import { Price } from '../../../../domain/value-objects/price.vo';
import { ProductCategory } from '../../../../domain/value-objects/product-category.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';
import { ProductDbEntity } from './entities/product.db-entity';

export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductDbEntity)
    private readonly productRepository: Repository<ProductDbEntity>,

    @Inject(PRODUCT_CACHE_REPOSITORY)
    private readonly productCacheRepository: ProductCacheRepositoryPort
  ) {}

  getNextId(): Promise<ProductId> {
    return Promise.resolve(new ProductId(randomUUID()));
  }
  async findAll(): Promise<Product[]> {
    const cachedResults = await this.productCacheRepository.findAll();
    if (cachedResults && cachedResults.length > 0) {
      return this.toDomainEntities(cachedResults);
    }

    const products = await this.productRepository.find();
    await this.productCacheRepository.saveAll(products);
    return this.toDomainEntities(products);
  }

  async findByCategory(category: ProductCategory): Promise<Product[]> {
    const cachedResults = await this.productCacheRepository.findByCategory(category.getValue());
    if (cachedResults && cachedResults.length > 0) {
      return this.toDomainEntities(cachedResults);
    }
    const products = await this.productRepository.find({
      where: {
        categories: Like(`%${category.getValue()}%`),
      },
    });
    if (products.length > 0) {
      await this.productCacheRepository.saveByCategory(category.getValue(), products);
    }
    return this.toDomainEntities(products);
  }

  async findById(id: ProductId, includePriceHistory?: boolean): Promise<Product | null> {
    const cachedProduct = await this.productCacheRepository.findById(id);
    if (cachedProduct) {
      return this.toDomainEntity(cachedProduct);
    }
    const product = includePriceHistory
      ? await this.productRepository.findOne({
          where: { id: id.getValue() },
          select: [
            'id',
            'name',
            'description',
            'price',
            'currency',
            'categories',
            'sku',
            'createdAt',
            'updatedAt',
          ],
          relations: ['priceHistory'],
        })
      : await this.productRepository.findOne({
          where: { id: id.getValue() },
        });

    if (!product) {
      return null;
    }
    await this.productCacheRepository.save(product);
    return this.toDomainEntity(product);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.productRepository.findOne({ where: { sku } });
    if (!product) {
      return null;
    }
    await this.productCacheRepository.save(product);
    return this.toDomainEntity(product);
  }
  
  async save(product: Product): Promise<Product> {
    const dbEntity = this.toDbEntity(product);
    await this.productRepository.save(dbEntity);
    await this.productCacheRepository.save(dbEntity);

    return this.toDomainEntity(dbEntity);
  }
  async remove(id: ProductId): Promise<void> {
    await this.productRepository.delete(id.getValue());
    await this.productCacheRepository.remove(id);
  }

  private toDomainEntities(dbEntities: ProductDbEntity[]): Product[] {
    return dbEntities.map((dbEntity) => this.toDomainEntity(dbEntity));
  }

  private toDomainEntity(dbEntity: ProductDbEntity): Product {
    return Product.create({
      id: new ProductId(dbEntity.id),
      name: dbEntity.name,
      description: dbEntity.description,
      price: new Price(dbEntity.price),
      categories: dbEntity.categories.map((cat) => new ProductCategory(cat)),
      sku: dbEntity.sku,
      currency: new Currency(dbEntity.currency),
      priceHistory: dbEntity.priceHistory.map((entry) => ({
        price: new Price(entry.price),
        changedAt: entry.changedAt,
      }))}
    );
  }

  private toDbEntity(product: Product): ProductDbEntity {
    const dbEntity = new ProductDbEntity();
    dbEntity.id = product.getId().getValue();
    dbEntity.name = product.getName();
    dbEntity.description = product.getDescription();
    dbEntity.price = product.getPrice().getValue();
    dbEntity.currency = product.getCurrency().getValue();
    dbEntity.categories = product.getCategories().map((cat) => cat.getValue());
    dbEntity.sku = product.getSku();
    dbEntity.createdAt = product.getCreatedAt();
    dbEntity.updatedAt = product.getUpdatedAt();
    dbEntity.priceHistory = product.getPriceHistory().map((entry) => ({
      price: entry.price.getValue(),
      changedAt: entry.changedAt,
    }));
    return dbEntity;
  }
}
