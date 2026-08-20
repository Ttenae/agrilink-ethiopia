import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmersModule } from './farmers/farmers.module';
import { BuyersModule } from './buyers/buyers.module';
import { TransportersModule } from './transporters/transporters.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Rate limiting - 10 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmersModule,
    BuyersModule,
    TransportersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    AdminModule,
    ChatModule,
    AnalyticsModule,
    AiModule,  // ✅ ADDED
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}