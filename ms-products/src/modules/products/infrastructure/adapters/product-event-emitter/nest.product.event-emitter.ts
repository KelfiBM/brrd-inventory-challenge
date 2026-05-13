import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_STREAMING_CLIENT } from '../../../../../configs/app.const';
import { ProductEventEmitterPort } from '../../../application/ports/product.event-emitter.port';
import { CreateProductCommand } from '../../../commands/create-product.command';
import { DeleteProductCommand } from '../../../commands/delete-product.command';
import { UpdateProductCommand } from '../../../commands/update-product.command';
import { CommandNames, DomainEventNames } from '../../../configs/products.consts';
import { ProductChangedEvent } from '../../../domain/events/product-changed.event';

type ProductChangedEventDto = {
  metadata: {
    correlationId: string;
    timestamp: Date;
  };
  data: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    categories: string[];
    sku: string;
    priceHistory?: { price: number; changedAt: Date }[];
    createdAt: Date;
    updatedAt: Date;
  };
};

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
  async emitProductCreated(event: ProductChangedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_CREATED, this.mapToProductChangedEventDto(event));
  }
  async emitProductUpdated(event: ProductChangedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_UPDATED, this.mapToProductChangedEventDto(event));
  }
  async emitProductDeleted(event: ProductChangedEvent): Promise<void> {
    this.nestClient.emit(DomainEventNames.PRODUCT_DELETED, this.mapToProductChangedEventDto(event));
  }

  mapToProductChangedEventDto(event: ProductChangedEvent): ProductChangedEventDto {
    return {
      metadata: {
        correlationId: event.metadata.correlationId.getValue(),
        timestamp: event.metadata.timestamp,
      },
      data: {
        id: event.data.getId().getValue(),
        name: event.data.getName(),
        description: event.data.getDescription(),
        price: event.data.getPrice().getValue(),
        currency: event.data.getCurrency().getValue(),
        categories: event.data.getCategories().map((cat) => cat.getValue()),
        sku: event.data.getSku(),
        priceHistory: event.data.getPriceHistory()?.map((ph) => ({
          price: ph.price.getValue(),
          changedAt: ph.changedAt,
        })),
        createdAt: event.data.getCreatedAt(),
        updatedAt: event.data.getUpdatedAt(),
      },
    };
  }
}
