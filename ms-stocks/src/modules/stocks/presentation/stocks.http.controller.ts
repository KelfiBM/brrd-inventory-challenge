import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UnprocessableEntityException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { routesV1 } from '../../../configs/app.routes';
import { FindOneStockUseCase } from '../application/use-cases/find-one-stock.use-case';
import { RequestStockMovementCreationUseCase } from '../application/use-cases/request-stock-movement-creation.use-case';
import { StockNotEnoughError } from '../domain/errors/stock-not-enough.error';
import { StockNotFoundError } from '../domain/errors/stock-not-found.error';
import { ProductId } from '../domain/value-objects/product-id.vo';
import { Roles } from './decorators/usre-role.decorator';
import { CreateStockMovementRequestDto } from './dtos/create-stock-movement.request.dto';
import { FindStockResponseDto } from './dtos/find-stock.response.dto';
import { IdResponseDto } from './dtos/id.response.dto';
import { Role } from './enum/role.enum';
import { AuthGuard } from './guards/auth.guard';
import { HttpResponseInterceptor } from './interceptors/http-response.interceptor';
import { StockIdempotencyInterceptor } from './interceptors/stock-idempotency.interceptor';

@Controller(routesV1.version)
@UseGuards(AuthGuard)
@UseInterceptors(HttpResponseInterceptor)
export class StocksHttpController {
  constructor(
    private readonly requestStockMovementCreationUseCase: RequestStockMovementCreationUseCase,
    private readonly findOneStockUseCase: FindOneStockUseCase,
  ) {}

  @UseInterceptors(StockIdempotencyInterceptor)
  @Roles(Role.Admin)
  @Post(routesV1.movements.create)
  async requestCreate(
    @Param('productId') id: string,
    @Body() createStockMovementRequestDto: CreateStockMovementRequestDto,
  ): Promise<IdResponseDto> {
    try {
      const productId = await this.requestStockMovementCreationUseCase.execute({
        amount: createStockMovementRequestDto.amount,
        productId: new ProductId(id),
        movementType: createStockMovementRequestDto.movementType as
          | 'IN'
          | 'OUT',
      });
      return {
        id: productId.getValue(),
        message: 'Stock Movement creation requested successfully',
      };
    } catch (error) {
      if (error instanceof StockNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof StockNotEnoughError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }

  @Get(routesV1.stocks.getById)
  async findOneRequest(
    @Param('productId') id: string,
  ): Promise<FindStockResponseDto> {
    try {
      const stockResponse = await this.findOneStockUseCase.execute({
        id: new ProductId(id),
      });
      return {
        data: {
          productId: stockResponse.productId,
          productName: stockResponse.productName,
          stock: stockResponse.stock,
        },
      };
    } catch (error) {
      if (error instanceof StockNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(routesV1.movements.root)
  async findAllMovementsRequest(
    @Param('productId') id: string,
  ): Promise<FindStockResponseDto> {
    const stockResponse = await this.findOneStockUseCase.execute({
      id: new ProductId(id),
      includeStockMovements: true,
    });
    return {
      data: {
        productId: stockResponse.productId,
        movementHistory: stockResponse.movementHistory,
      },
    };
  }
}
