import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import FormData from 'form-data';  // ✅ Fixed: default import
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'disease-detection');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  // ==================== DETECT DISEASE ====================

  async detectDisease(file: any, userId: string) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large. Max size is 10MB.');
    }

    try {
      const filename = `${uuidv4()}_${Date.now()}_${file.originalname}`;
      const userUploadDir = path.join(this.UPLOAD_DIR, userId);
      if (!fs.existsSync(userUploadDir)) {
        fs.mkdirSync(userUploadDir, { recursive: true });
      }
      const filePath = path.join(userUploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      // ✅ Fixed: FormData is now constructable with default import
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      this.logger.log(`Sending image to AI service: ${file.originalname}`);

      const response = await axios.post(`${this.AI_SERVICE_URL}/predict/disease`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      });

      const result = response.data;

      const detection = await (this.prisma as any).diseaseDetection.create({
        data: {
          userId,
          imageUrl: `/uploads/disease-detection/${userId}/${filename}`,
          disease: result.disease,
          confidence: result.confidence,
          isHealthy: result.is_healthy || false,
          treatment: result.treatment,
          description: result.description,
          prevention: result.prevention,
          metadata: {
            originalFilename: file.originalname,
            modelVersion: result.model_version || '1.0.0',
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Disease detection saved: ${detection.id} - ${result.disease}`);

      return {
        detectionId: detection.id,
        disease: result.disease,
        confidence: result.confidence,
        isHealthy: result.is_healthy || false,
        treatment: result.treatment,
        description: result.description,
        prevention: result.prevention,
        imageUrl: detection.imageUrl,
        createdAt: detection.createdAt,
      };
    } catch (error) {
      this.logger.error('AI Service error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException('AI service is not available. Please try again later.');
      }
      throw new BadRequestException('Failed to analyze image. Please try again.');
    }
  }

  // ==================== GET DETECTION HISTORY ====================

  async getDetectionHistory(userId: string) {
    return (this.prisma as any).diseaseDetection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        disease: true,
        confidence: true,
        isHealthy: true,
        createdAt: true,
        imageUrl: true,
        treatment: true,
        description: true,
      },
    });
  }

  // ==================== GET SINGLE DETECTION ====================

  async getDetectionResult(id: string, userId: string) {
    const result = await (this.prisma as any).diseaseDetection.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException('Detection result not found');
    }

    if (result.userId !== userId) {
      throw new BadRequestException('You can only view your own detection results');
    }

    return result;
  }

  // ==================== GET DISEASE LIST ====================

  async getDiseaseList() {
    return [
      'Late Blight',
      'Powdery Mildew',
      'Rust',
      'Leaf Spot',
      'Healthy',
    ];
  }

  // ==================== GET DISEASE INFO ====================

  async getDiseaseInfo(name: string) {
    const diseaseInfo: Record<string, any> = {
      'Late Blight': {
        description: 'A serious fungal disease affecting tomatoes and potatoes. Causes dark spots and wilting.',
        treatment: 'Apply fungicide (Mancozeb or Chlorothalonil). Remove infected leaves. Ensure good air circulation.',
        prevention: 'Plant resistant varieties. Practice crop rotation. Avoid overhead watering.',
        symptoms: 'Dark, water-soaked spots on leaves. White fuzzy growth on undersides.',
      },
      'Powdery Mildew': {
        description: 'White powdery spots on leaves caused by fungal infection.',
        treatment: 'Apply sulfur-based fungicide. Use neem oil spray. Remove infected parts.',
        prevention: 'Avoid overhead watering. Ensure good sunlight exposure. Space plants properly.',
        symptoms: 'White powdery patches on leaves, stems, and flowers.',
      },
      'Rust': {
        description: 'Orange/brown pustules on leaves caused by fungal pathogen.',
        treatment: 'Apply fungicide (Triadimefon or Myclobutanil). Remove infected parts.',
        prevention: 'Use resistant varieties. Practice crop rotation. Remove crop debris.',
        symptoms: 'Small orange or brown spots on leaves. Yellowing and dropping of leaves.',
      },
      'Leaf Spot': {
        description: 'Circular spots on leaves caused by bacteria or fungi.',
        treatment: 'Apply copper-based fungicide. Remove infected leaves. Improve air circulation.',
        prevention: 'Avoid overhead irrigation. Practice crop rotation. Use disease-free seeds.',
        symptoms: 'Dark brown or black circular spots with yellow halos on leaves.',
      },
      'Healthy': {
        description: 'Plant appears healthy with no signs of disease.',
        treatment: 'No treatment needed. Continue good agricultural practices.',
        prevention: 'Maintain regular monitoring and good crop management.',
        symptoms: 'No visible symptoms. Plant is thriving.',
      },
    };

    const info = diseaseInfo[name];
    if (!info) {
      throw new NotFoundException(`Disease "${name}" not found`);
    }

    return info;
  }

  // ==================== DELETE DETECTION ====================

  async deleteDetection(id: string, userId: string) {
    const result = await (this.prisma as any).diseaseDetection.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException('Detection result not found');
    }

    if (result.userId !== userId) {
      throw new BadRequestException('You can only delete your own detection results');
    }

    try {
      const filePath = path.join(process.cwd(), 'public', result.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete image file: ${error.message}`);
    }

    return (this.prisma as any).diseaseDetection.delete({
      where: { id },
    });
  }
}