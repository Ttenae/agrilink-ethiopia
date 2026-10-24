import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmersModule } from './farmers/farmers.module';
import { BuyersModule } from './buyers/buyers.module';
import { TransportersModule } from './transporters/transporters.module';

// Business modules
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';

// AI modules
import { AiModule } from './ai/ai.module';

// ✅ Weather module (NEW)
import { WeatherModule } from './weather/weather.module';

// Controllers
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10,  // 10 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Auth & Users
    AuthModule,
    UsersModule,
    FarmersModule,
    BuyersModule,
    TransportersModule,

    // Business
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    ChatModule,
    AdminModule,
    AnalyticsModule,

    // AI
    AiModule,

    // ✅ Weather (NEW — this enables /api/weather/* routes)
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}