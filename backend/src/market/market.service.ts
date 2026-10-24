import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  // Common Ethiopian commodities
  private readonly commodities = ['Coffee', 'Maize', 'Sesame', 'Wheat', 'Teff'];
  private readonly markets = ['Addis Ababa', 'Dire Dawa', 'Jimma', 'Hawassa'];

  constructor(private prisma: PrismaService) {}

  // ==================== SEED REALISTIC DATA ====================
  async seedRealisticData() {
    try {
      // Clear old data to prevent duplicates
      await this.prisma.marketPrice.deleteMany({});

      const dataToInsert = [];
      const today = new Date();

      for (const commodity of this.commodities) {
        // Create 14 days of history for each commodity
        for (let i = 13; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);

          // Base prices in ETB per Quintal
          let basePrice = 0;
          if (commodity === 'Coffee') basePrice = 8500;
          if (commodity === 'Maize') basePrice = 3200;
          if (commodity === 'Sesame') basePrice = 6500;
          if (commodity === 'Wheat') basePrice = 4100;
          if (commodity === 'Teff') basePrice = 5500;

          // Add random daily fluctuation (-2% to +2%)
          const fluctuation = basePrice * (Math.random() * 0.04 - 0.02);
          
          dataToInsert.push({
            commodity,
            market: this.markets[Math.floor(Math.random() * this.markets.length)],
            price: Math.round(basePrice + fluctuation),
            unit: 'Quintal',
            date: date,
          });
        }
      }

      await this.prisma.marketPrice.createMany({ data: dataToInsert });
      this.logger.log('✅ Successfully seeded realistic market data');
      return { success: true, message: 'Seeded 70 price records' };
    } catch (error) {
      this.logger.error(`❌ Seeding failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== GET LATEST PRICES ====================
  async getLatestPrices() {
    const results = [];

    for (const commodity of this.commodities) {
      const latest = await this.prisma.marketPrice.findFirst({
        where: { commodity },
        orderBy: { date: 'desc' },
      });

      if (latest) {
        // Calculate 7-day trend
        const weekAgo = new Date(latest.date);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const oldPrice = await this.prisma.marketPrice.findFirst({
          where: { 
            commodity, 
            date: { lte: weekAgo } 
          },
          orderBy: { date: 'desc' },
        });

        let trend = 0;
        if (oldPrice && oldPrice.price > 0) {
          trend = ((latest.price - oldPrice.price) / oldPrice.price) * 100;
        }

        results.push({
          ...latest,
          trend: parseFloat(trend.toFixed(1)),
        });
      }
    }
    return results;
  }

  // ==================== GET PRICE HISTORY ====================
  async getPriceHistory(commodity: string) {
    return this.prisma.marketPrice.findMany({
      where: { commodity },
      orderBy: { date: 'asc' }, // Oldest to newest for chart
    });
  }
}