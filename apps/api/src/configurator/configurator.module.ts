import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfiguratorGateway } from './configurator.gateway';
import { ConfiguratorService } from './configurator.service';
import { PricingEngine } from './pricing.engine';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  providers: [ConfiguratorGateway, ConfiguratorService, PricingEngine],
  exports: [ConfiguratorService, PricingEngine],
})
export class ConfiguratorModule {}
