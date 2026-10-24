import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler'; // 👈 Added to prevent rate limit blocks

@Controller('weather')
@UseGuards(JwtAuthGuard)
@SkipThrottle() // 👈 Added to prevent 400 errors from refreshing too fast
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  // The frontend calls this endpoint
  @Get('region/:region')
  async getByRegion(@Param('region') region: string) {
    return this.weatherService.getWeatherByRegion(region);
  }

  // Optional: If you want to fetch by lat/lon directly
  @Get('full')
  async getFull(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    return this.weatherService.getWeatherWithCache(
      parseFloat(lat),
      parseFloat(lon),
    );
  }
}