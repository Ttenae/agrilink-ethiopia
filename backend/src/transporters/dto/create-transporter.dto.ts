import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateTransporterDto {
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @IsString()
  @IsNotEmpty()
  vehicleCapacity: string;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  description?: string;
}