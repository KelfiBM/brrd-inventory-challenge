import { CreateProductCommand } from '@products/commands/create-product.command';
import { DeleteProductCommand } from '@products/commands/delete-product.command';
import { UpdateProductCommand } from '@products/commands/update-product.command';
import { ProductChangedEvent } from '@products/domain/events/product-changed.event';

export interface ProductEventEmitterPort {
  emitCreateProductCommand(command: CreateProductCommand): Promise<void>;
  emitUpdateProductCommand(command: UpdateProductCommand): Promise<void>;
  emitDeleteProductCommand(command: DeleteProductCommand): Promise<void>;
  emitProductCreated(event: ProductChangedEvent): Promise<void>;
  emitProductUpdated(event: ProductChangedEvent): Promise<void>;
  emitProductDeleted(event: ProductChangedEvent): Promise<void>;
}

export const PRODUCT_EVENT_EMITTER = Symbol('PRODUCT_EVENT_EMITTER');
