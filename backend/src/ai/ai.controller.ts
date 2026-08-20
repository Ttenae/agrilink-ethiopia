import { Controller, Post, Get, Delete, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

// ✅ Use 'any' type to avoid Express.Multer issue
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('detect-disease')
  @UseInterceptors(FileInterceptor('image', {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }))
  async detectDisease(
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    const userId = (req.user as any).id;
    return this.aiService.detectDisease(file, userId);
  }

  @Get('history')
  async getDetectionHistory(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.aiService.getDetectionHistory(userId);
  }

  @Get('history/:id')
  async getDetectionResult(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.aiService.getDetectionResult(id, userId);
  }

  @Get('diseases')
  async getDiseaseList() {
    return this.aiService.getDiseaseList();
  }

  @Get('diseases/:name')
  async getDiseaseInfo(@Param('name') name: string) {
    return this.aiService.getDiseaseInfo(name);
  }

  @Delete('history/:id')
  async deleteDetection(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.aiService.deleteDetection(id, userId);
  }
}