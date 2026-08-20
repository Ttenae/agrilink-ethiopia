import { IsOptional, IsString, IsDateString } from 'class-validator';

export class TransporterStatsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';
}