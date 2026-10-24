import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketModule } from '../market/market.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [PrismaModule, MarketModule, WeatherModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}