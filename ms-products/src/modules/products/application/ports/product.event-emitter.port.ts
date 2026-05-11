import { CreateProductCommand } from '@products/commands/create-product.command';
import { DeleteProductCommand } from '@products/commands/delete-product.command';
import { UpdateProductCommand } from '@products/commands/update-product.command';
import { ProductCreatedEvent } from '@products/domain/events/product-created.event';
import { ProductDeletedEvent } from '@products/domain/events/product-deleted.event';
import { ProductUpdatedEvent } from '@products/domain/events/product-updated.event';

export interface ProductEventEmitterPort {
  emitCreateProductCommand(command: CreateProductCommand): Promise<void>;
  emitUpdateProductCommand(command: UpdateProductCommand): Promise<void>;
  emitDeleteProductCommand(command: DeleteProductCommand): Promise<void>;
  emitProductCreated(event: ProductCreatedEvent): Promise<void>;
  emitProductUpdated(event: ProductUpdatedEvent): Promise<void>;
  emitProductDeleted(event: ProductDeletedEvent): Promise<void>;
}

export const PRODUCT_EVENT_EMITTER = Symbol('PRODUCT_EVENT_EMITTER');
