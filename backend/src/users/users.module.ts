import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UsersController, UploadController], 
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}