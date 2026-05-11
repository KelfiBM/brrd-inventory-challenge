import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { ProductEventEmitterPort } from '../../../application/ports/product.event-emitter.port';
import { CreateProductCommand } from '../../../commands/create-product.command';
import { DeleteProductCommand } from '../../../commands/delete-product.command';
import { UpdateProductCommand } from '../../../commands/update-product.command';
import { CommandNames, DomainEventNames } from '../../../configs/products.consts';
import { ProductCreatedEvent } from '../../../domain/events/product-created.event';
import { ProductDeletedEvent } from '../../../domain/events/product-deleted.event';
import { ProductUpdatedEvent } from '../../../domain/events/product-updated.event';

@Injectable()
export class NestProductEventEmitter implements ProductEventEmitterPort {
  constructor(@Inject(EVENT_STREAMING_CLIENT) private readonly nestClient: ClientProxy) {}

  async emitCreateProductCommand(command: CreateProductCommand): Promise<void> {
    this.nestClient.emit(CommandNames.CREATE_PRODUCT, command);
  }
  async emitUpdateProductCommand(command: UpdateProductCommand): Promise<void> {
    this.nestClient.emit(CommandNames.UPDATE_PRODUCT, command);
  }
  async emitDeleteProductCommand(command: DeleteProductCommand): Promise<void> {
    this.nestClient.emit(CommandNames.DELETE_PRODUCT, command);
  }
  async emitProductCreated(event: ProductCreatedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_CREATED, event);
  }
  async emitProductUpdated(event: ProductUpdatedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_UPDATED, event);
  }
  async emitProductDeleted(event: ProductDeletedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_DELETED, event);
  }
}
