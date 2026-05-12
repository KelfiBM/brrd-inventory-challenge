import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateStockMovementRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['IN', 'OUT'])
  movementType: string;

  @IsNumber()
  @IsPositive()
  @IsInt()
  @Min(1)
  amount: number;
}
