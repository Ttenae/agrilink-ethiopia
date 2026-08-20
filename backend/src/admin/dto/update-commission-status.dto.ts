import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommissionStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'PENDING' | 'PAID' | 'FAILED';
}