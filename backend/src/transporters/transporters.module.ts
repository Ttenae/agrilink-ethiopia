import { Module } from '@nestjs/common';
import { TransportersController } from './transporters.controller';
import { TransportersService } from './transporters.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TransportersController],
  providers: [TransportersService, PrismaService],
})
export class TransportersModule {}