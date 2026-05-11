import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categories: string[];

  @IsString()
  @IsNotEmpty()
  sku: string;
}
