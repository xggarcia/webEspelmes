import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';
import { TransitionOrderSchema, type TransitionOrderDto } from './orders.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Public()
  @Get('shipping-estimate')
  shippingEstimate(@Query('postalCode') postalCode: string) {
    return this.orders.getShippingEstimate(postalCode ?? '');
  }

  @Get('mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.orders.listForUser(user.id);
  }

  @Get(':id')
  async one(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const order = await this.orders.findById(id);
    if (user.role !== Role.ADMIN && order.userId && order.userId !== user.id) {
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND' });
    return order;
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async transition(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(TransitionOrderSchema)) dto: TransitionOrderDto,
  ) {
    const updated = await this.orders.transition(id, dto.status, {
      actorId: user.id,
      ...(dto.reason ? { reason: dto.reason } : {}),
    });
    await this.orders.notifyStatusChange(updated.id, dto.status);
    return updated;
  }
}
