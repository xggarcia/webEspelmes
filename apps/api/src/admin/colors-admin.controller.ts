import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';

const CreateColorSchema = z.object({
  name: z.string().min(1).max(80),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format: #RRGGBB'),
  sortOrder: z.number().int().default(0),
});

const SetProductColorsSchema = z.object({
  colorIds: z.array(z.string()),
});

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/colors')
export class ColorsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  listAll() {
    return this.prisma.color.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateColorSchema)) dto: z.infer<typeof CreateColorSchema>) {
    return this.prisma.color.create({ data: dto });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.prisma.color.delete({ where: { id } });
  }

  @Get('product/:productId')
  productColors(@Param('productId') productId: string) {
    return this.prisma.productColor.findMany({
      where: { productId },
      include: { color: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Put('product/:productId')
  async setProductColors(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(SetProductColorsSchema)) dto: z.infer<typeof SetProductColorsSchema>,
  ) {
    await this.prisma.productColor.deleteMany({ where: { productId } });
    if (dto.colorIds.length > 0) {
      await this.prisma.productColor.createMany({
        data: dto.colorIds.map((colorId, i) => ({ productId, colorId, sortOrder: i })),
      });
    }
    return this.prisma.productColor.findMany({
      where: { productId },
      include: { color: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
