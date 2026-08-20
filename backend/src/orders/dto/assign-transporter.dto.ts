import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTransporterDto {
  @IsUUID()
  @IsNotEmpty()
  transporterId: string;
}