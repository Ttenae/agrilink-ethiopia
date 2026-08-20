import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0.1)
  quantity: number;
}