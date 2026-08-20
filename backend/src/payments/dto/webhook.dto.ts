import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ChapaWebhookDto {
  @IsString()
  @IsNotEmpty()
  tx_ref: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  payment_id?: string;
}