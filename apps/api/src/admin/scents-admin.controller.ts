import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';

const CreateScentSchema = z.object({
  nameEs: z.string().min(1).max(120),
  nameCa: z.string().min(1).max(120),
  sortOrder: z.number().int().default(0),
});

const SetProductScentsSchema = z.object({
  scentIds: z.array(z.string()),
});

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/scents')
export class ScentsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  listAll() {
    return this.prisma.scent.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameEs: 'asc' }] });
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateScentSchema)) dto: z.infer<typeof CreateScentSchema>) {
    return this.prisma.scent.create({ data: dto });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.prisma.scent.delete({ where: { id } });
  }

  @Get('product/:productId')
  productScents(@Param('productId') productId: string) {
    return this.prisma.productScent.findMany({
      where: { productId },
      include: { scent: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Put('product/:productId')
  async setProductScents(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(SetProductScentsSchema)) dto: z.infer<typeof SetProductScentsSchema>,
  ) {
    await this.prisma.productScent.deleteMany({ where: { productId } });
    if (dto.scentIds.length > 0) {
      await this.prisma.productScent.createMany({
        data: dto.scentIds.map((scentId, i) => ({ productId, scentId, sortOrder: i })),
      });
    }
    return this.prisma.productScent.findMany({
      where: { productId },
      include: { scent: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
