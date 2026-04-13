import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

const UpdateProfileSchema = z.object({ name: z.string().min(1).max(120).optional() });

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: { name?: string },
  ) {
    return this.users.updateProfile(user.id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.users.listCustomers(Number(page) || 1, Number(pageSize) || 20);
  }
}
