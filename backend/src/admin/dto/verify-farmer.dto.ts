import { IsBoolean, IsOptional } from 'class-validator';

export class VerifyFarmerDto {
  @IsBoolean()
  verified: boolean;
}