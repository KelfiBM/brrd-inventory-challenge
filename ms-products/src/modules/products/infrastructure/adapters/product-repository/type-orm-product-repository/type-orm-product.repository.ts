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
import { Price } from '../../../../domain/value-objects/price.vo';
import { ProductCategory } from '../../../../domain/value-objects/product-category.vo';
import { ProductId } from '../../../../domain/value-objects/product-id.vo';
import { ProductDbEntity } from './schema/product.db-entity';

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
    if (cachedResults) {
      return this.toDomainEntities(cachedResults);
    }

    const products = await this.productRepository.find();
    await this.productCacheRepository.saveAll(products);
    return this.toDomainEntities(products);
  }

  async findByCategory(category: ProductCategory): Promise<Product[]> {
    const cachedResults = await this.productCacheRepository.findByCategory(category.getValue());
    if (cachedResults) {
      return this.toDomainEntities(cachedResults);
    }
    const products = await this.productRepository.find({
      where: {
        categories: Like(`%${category.getValue()}%`),
      },
    });

    await this.productCacheRepository.saveByCategory(category.getValue(), products);
    return this.toDomainEntities(products);
  }

  async findById(id: ProductId, includePriceHistory?: boolean): Promise<Product> {
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
      throw new Error(`Product with ID ${id.getValue()} not found`);
    }
    await this.productCacheRepository.save(product);
    return this.toDomainEntity(product);
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { sku } });
    if (!product) {
      throw new Error(`Product with SKU ${sku} not found`);
    }
    await this.productCacheRepository.save(product);
    return this.toDomainEntity(product);
  }
  async save(product: Product): Promise<Product> {
    const dbEntity = this.toDbEntity(product);
    await this.productRepository.save(dbEntity);
    await this.productCacheRepository.delAll();
    await this.productCacheRepository.delByCategory();
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
    return Product.create(
      dbEntity.id,
      dbEntity.name,
      dbEntity.description,
      dbEntity.price,
      dbEntity.categories,
      dbEntity.sku,
      dbEntity.currency,
      dbEntity.priceHistory.map((entry) => ({
        price: new Price(entry.price),
        changedAt: entry.changedAt,
      }))
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
    return dbEntity;
  }
}
