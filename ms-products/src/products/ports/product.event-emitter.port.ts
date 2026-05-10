import { CreateProductCommand } from '../commands/create-product.command';
import { UpdateProductCommand } from '../commands/update-product.command';
import { ProductCreatedEvent } from '../domain-events/product-created.event';
import { ProductUpdatedEvent } from '../domain-events/product-updated.event';

export interface ProductEventEmitterPort {
  emitCreateProductCommand(command: CreateProductCommand): Promise<void>;
  emitUpdateProductCommand(command: UpdateProductCommand): Promise<void>;
  emitProductCreated(event: ProductCreatedEvent): Promise<void>;
  emitProductUpdated(event: ProductUpdatedEvent): Promise<void>;
}

export const PRODUCT_EVENT_EMITTER = Symbol('PRODUCT_EVENT_EMITTER');
