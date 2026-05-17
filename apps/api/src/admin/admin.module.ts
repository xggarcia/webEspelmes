import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductsAdminController } from './products-admin.controller';
import { CategoriesAdminController } from './categories-admin.controller';
import { ColorsAdminController } from './colors-admin.controller';
import { ScentsAdminController } from './scents-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, ProductsAdminController, CategoriesAdminController, ColorsAdminController, ScentsAdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
