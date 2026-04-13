import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminService } from './admin.service';

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('orders/recent')
  recentOrders(@Query('limit') limit?: string) {
    return this.admin.recentOrders(Number(limit) || 20);
  }

  @Get('customers')
  customers(@Query('limit') limit?: string) {
    return this.admin.listCustomers(Number(limit) || 50);
  }

  @Get('audit')
  audit_log(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.audit.list({
      limit: Number(limit) || 100,
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
    });
  }
}
