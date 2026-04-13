import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommandRegistry } from './command-registry';

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/commands')
export class CommandsController {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return { commands: this.registry.listNames() };
  }

  @Get('history')
  history(@Query('limit') limit?: string) {
    return this.prisma.commandRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 200),
    });
  }

  @Throttle({ commands: { limit: 30, ttl: 60_000 } })
  @Post(':name')
  async run(
    @Param('name') name: string,
    @Body() body: unknown,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Headers('user-agent') ua: string | undefined,
  ) {
    return this.registry.run(name, body ?? {}, {
      actorId: user.id,
      actorRole: user.role,
      ip: req.ip ?? '',
      ...(ua ? { userAgent: ua } : {}),
    });
  }
}
