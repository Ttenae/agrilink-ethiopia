import { Controller, Get, Param, UseGuards, Post } from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('market')
@UseGuards(JwtAuthGuard)
@SkipThrottle() // Prevent 429 errors if clicking fast
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('latest')
  async getLatest() {
    return this.marketService.getLatestPrices();
  }

  @Get('history/:commodity')
  async getHistory(@Param('commodity') commodity: string) {
    return this.marketService.getPriceHistory(commodity);
  }

  @Post('scrape')
  async triggerScrape() {
    return this.marketService.seedRealisticData();
  }
}