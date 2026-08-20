import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;
}