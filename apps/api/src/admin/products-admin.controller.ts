import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { z } from 'zod';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const CreateProductSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(400).default(''),
  description: z.string().max(5000).default(''),
  basePriceCents: z.number().int().nonnegative(),
  vatRate: z.number().min(0).max(1).default(0.21),
  stock: z.number().int().nonnegative().default(0),
  isCustomizable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  heroImageUrl: z.string().url().optional().nullable(),
  categoryId: z.string().min(1),
});
const UpdateProductSchema = CreateProductSchema.partial();

type CreateProductDto = z.infer<typeof CreateProductSchema>;
type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

@ApiTags('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/products')
export class ProductsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true, _count: { select: { orderItems: true } } },
    });
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        images: true,
        options: { include: { values: true } },
      },
    });
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateProductSchema)) dto: CreateProductDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const created = await this.prisma.product.create({ data: dto });
    await this.audit.record({
      action: 'product.create',
      actorId: user.id,
      target: created.id,
      metadata: { slug: created.slug, name: created.name },
      ip: req.ip ?? '',
    });
    return created;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) dto: UpdateProductDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const before = await this.prisma.product.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.product.update({ where: { id }, data: dto });
    await this.audit.record({
      action: 'product.update',
      actorId: user.id,
      target: id,
      metadata: { changes: this.diff(before, updated) },
      ip: req.ip ?? '',
    });
    return updated;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    // Soft-delete: flip isActive so we preserve order history.
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.record({
      action: 'product.deactivate',
      actorId: user.id,
      target: id,
      ip: req.ip ?? '',
    });
    return updated;
  }

  private diff(before: Record<string, unknown>, after: Record<string, unknown>) {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of Object.keys(after)) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changes[k] = { from: before[k], to: after[k] };
      }
    }
    return changes;
  }
}
