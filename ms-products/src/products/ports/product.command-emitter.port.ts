import { CreateProductCommand } from '../commands/create-product.command';

export interface ProductCommandEmitterPort {
  emitCreateProductCommand(command: CreateProductCommand): Promise<void>;
}

export const PRODUCT_COMMAND_EMITTER = Symbol('PRODUCT_COMMAND_EMITTER');
