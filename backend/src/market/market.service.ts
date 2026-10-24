import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);

  private readonly commodities = ['Coffee', 'Maize', 'Sesame', 'Wheat', 'Teff'];
  private readonly markets = ['Addis Ababa', 'Dire Dawa', 'Jimma', 'Hawassa'];

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.marketPrice.count();
    // Generate 5,000 points per commodity to make intraday timeframes work
    if (count < 10000) {
      this.logger.log('Generating high-density market data for intraday charts...');
      await this.seedHighDensityData();
    }
  }

  async seedHighDensityData() {
    try {
      await this.prisma.marketPrice.deleteMany({});
      const dataToInsert = [];
      const now = Date.now();

      for (const commodity of this.commodities) {
        let currentPrice = commodity === 'Coffee' ? 8500 : commodity === 'Maize' ? 3200 : commodity === 'Sesame' ? 6500 : commodity === 'Wheat' ? 4100 : 5500;
        
        // Generate 5,000 minutes of data (approx 3.5 days of 1m candles)
        for (let i = 5000; i >= 0; i--) {
          // Random walk to simulate market volatility
          const volatility = currentPrice * 0.001; 
          const change = (Math.random() - 0.5) * volatility * 2;
          currentPrice = Math.max(currentPrice + change, 1000); // Prevent price from hitting 0

          dataToInsert.push({
            commodity,
            market: this.markets[Math.floor(Math.random() * this.markets.length)],
            price: Math.round(currentPrice * 100) / 100, // 2 decimal places
            unit: 'Quintal',
            date: new Date(now - i * 60000), // 1 minute intervals
          });
        }
      }

      // Chunk inserts to prevent database crash
      for (let i = 0; i < dataToInsert.length; i += 1000) {
        await this.prisma.marketPrice.createMany({ data: dataToInsert.slice(i, i + 1000) });
      }
      
      this.logger.log(`✅ Seeded ${dataToInsert.length} high-density data points`);
    } catch (error) {
      this.logger.error(`❌ Seeding failed: ${error.message}`);
    }
  }

  async getLatestPrices() {
    const results = [];
    for (const commodity of this.commodities) {
      const latest = await this.prisma.marketPrice.findFirst({
        where: { commodity },
        orderBy: { date: 'desc' },
      });
      if (latest) {
        const oldPrice = await this.prisma.marketPrice.findFirst({
          where: { commodity, date: { lte: new Date(latest.date.getTime() - 86400000) } }, // 24h ago
          orderBy: { date: 'desc' },
        });
        const trend = oldPrice ? ((latest.price - oldPrice.price) / oldPrice.price) * 100 : 0;
        results.push({ ...latest, trend: parseFloat(trend.toFixed(2)) });
      }
    }
    return results;
  }

  async getPriceHistory(commodity: string) {
    // Return the last 5000 data points to the frontend
    return this.prisma.marketPrice.findMany({
      where: { commodity },
      orderBy: { date: 'asc' },
      take: 5000, 
    });
  }
}