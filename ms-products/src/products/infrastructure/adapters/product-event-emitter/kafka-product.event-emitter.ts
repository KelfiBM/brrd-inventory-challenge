import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CommandNames, DomainEventNames } from '../../../../configs/app.events';
import { ProductEventEmitterPort } from '../../../application/ports/product.event-emitter.port';
import { CreateProductCommand } from '../../../commands/create-product.command';
import { DeleteProductCommand } from '../../../commands/delete-product.command';
import { UpdateProductCommand } from '../../../commands/update-product.command';
import { ProductCreatedEvent } from '../../../domain/events/product-created.event';
import { ProductDeletedEvent } from '../../../domain/events/product-deleted.event';
import { ProductUpdatedEvent } from '../../../domain/events/product-updated.event';

export const KAFKA_PRODUCT_EVENT_EMITTER = Symbol('KAFKA_PRODUCT_EVENT_EMITTER');

export class KafkaProductEventEmitter implements ProductEventEmitterPort {
  constructor(@Inject(KAFKA_PRODUCT_EVENT_EMITTER) private readonly kafkaClient: ClientKafka) {}

  async emitCreateProductCommand(command: CreateProductCommand): Promise<void> {
    this.kafkaClient.emit(CommandNames.CREATE_PRODUCT, command);
  }
  async emitUpdateProductCommand(command: UpdateProductCommand): Promise<void> {
    this.kafkaClient.emit(CommandNames.UPDATE_PRODUCT, command);
  }
  async emitDeleteProductCommand(command: DeleteProductCommand): Promise<void> {
    this.kafkaClient.emit(CommandNames.DELETE_PRODUCT, command);
  }
  async emitProductCreated(event: ProductCreatedEvent): Promise<void> {
    this.kafkaClient.emit(DomainEventNames.PRODUCT_CREATED, event);
  }
  async emitProductUpdated(event: ProductUpdatedEvent): Promise<void> {
    this.kafkaClient.emit(DomainEventNames.PRODUCT_UPDATED, event);
  }
  async emitProductDeleted(event: ProductDeletedEvent): Promise<void> {
    this.kafkaClient.emit(DomainEventNames.PRODUCT_DELETED, event);
  }
}
