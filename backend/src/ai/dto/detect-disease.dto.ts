import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class DetectDiseaseDto {
  @IsString()
  disease: string;

  @IsNumber()
  confidence: number;

  @IsBoolean()
  isHealthy: boolean;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  prevention?: string;
}

export class DiseaseDetectionResponseDto {
  @IsString()
  id: string;

  @IsString()
  disease: string;

  @IsNumber()
  confidence: number;

  @IsBoolean()
  isHealthy: boolean;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  prevention?: string;

  @IsString()
  imageUrl: string;

  @IsString()
  createdAt: string;
}