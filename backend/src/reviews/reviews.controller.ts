import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Get('farmer/:farmerId')
  findByFarmer(@Param('farmerId') farmerId: string) {
    return this.reviewsService.findByFarmer(farmerId);
  }

  @Get('farmer/:farmerId/rating')
  getFarmerRating(@Param('farmerId') farmerId: string) {
    return this.reviewsService.getFarmerRating(farmerId);
  }

  @Get('buyer/me')
  @UseGuards(JwtAuthGuard)
  findByBuyer(@Req() req) {
    return this.reviewsService.findByBuyer(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.reviewsService.remove(id, req.user.id, req.user.role);
  }
}