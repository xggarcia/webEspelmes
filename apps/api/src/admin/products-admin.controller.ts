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
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import type { Request } from 'express';
import { z } from 'zod';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const ProductOptionKindEnum = z.enum([
  'color',
  'size',
  'finish',
  'shape',
  'platform',
  'label',
  'accessory',
]);

const CreateOptionSchema = z.object({
  kind: ProductOptionKindEnum,
  label: z.string().min(1).max(100),
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const CreateOptionValueSchema = z.object({
  code: z.string().min(1).max(60).regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1).max(100),
  priceDeltaCents: z.number().int().default(0),
  meta: z.record(z.unknown()).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const UpdateOptionValueSchema = CreateOptionValueSchema.partial();

type CreateOptionDto = z.infer<typeof CreateOptionSchema>;
type CreateOptionValueDto = z.infer<typeof CreateOptionValueSchema>;
type UpdateOptionValueDto = z.infer<typeof UpdateOptionValueSchema>;

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
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(255).optional().nullable(),
      }),
    )
    .max(20)
    .optional(),
  modelUrl: z.string().optional().nullable(),
  modelMeta: z
    .object({
      scale: z.number().positive().optional(),
      yOffset: z.number().optional(),
      cameraFov: z.number().int().min(20).max(75).optional(),
    })
    .optional()
    .nullable(),
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
    const { modelMeta, images, ...rest } = dto;
    const data: Prisma.ProductUncheckedCreateInput = {
      ...rest,
      modelMeta:
        modelMeta === null || modelMeta === undefined
          ? Prisma.JsonNull
          : (modelMeta as Prisma.InputJsonValue),
      images: images?.length
        ? {
            create: images.map((img, index) => ({
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: index,
            })),
          }
        : undefined,
    };
    const created = await this.prisma.product.create({ data });
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
    const { modelMeta, images, ...rest } = dto;
    const data: Prisma.ProductUncheckedUpdateInput = { ...rest };
    if (modelMeta !== undefined) {
      data.modelMeta =
        modelMeta === null
          ? Prisma.JsonNull
          : (modelMeta as Prisma.InputJsonValue);
    }
    if (images !== undefined) {
      data.images = {
        deleteMany: {},
        create: images.map((img, index) => ({
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: index,
        })),
      };
    }
    const updated = await this.prisma.product.update({ where: { id }, data });
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

  // ── Options ────────────────────────────────────────────────────────────────

  @Post(':id/options')
  async createOption(
    @Param('id') productId: string,
    @Body(new ZodValidationPipe(CreateOptionSchema)) dto: CreateOptionDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const option = await this.prisma.productOption.create({
      data: { ...dto, productId },
      include: { values: true },
    });
    await this.audit.record({
      action: 'product.option.create',
      actorId: user.id,
      target: productId,
      metadata: { kind: dto.kind, label: dto.label },
      ip: req.ip ?? '',
    });
    return option;
  }

  @Delete(':id/options/:optionId')
  @HttpCode(204)
  async deleteOption(
    @Param('id') productId: string,
    @Param('optionId') optionId: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    await this.prisma.productOption.delete({
      where: { id: optionId, productId },
    });
    await this.audit.record({
      action: 'product.option.delete',
      actorId: user.id,
      target: productId,
      metadata: { optionId },
      ip: req.ip ?? '',
    });
  }

  @Post(':id/options/:optionId/values')
  async createOptionValue(
    @Param('id') productId: string,
    @Param('optionId') optionId: string,
    @Body(new ZodValidationPipe(CreateOptionValueSchema)) dto: CreateOptionValueDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    await this.prisma.productOption.findUniqueOrThrow({
      where: { id: optionId, productId },
    });
    const { meta, ...rest } = dto;
    const value = await this.prisma.productOptionValue.create({
      data: {
        ...rest,
        optionId,
        meta: meta === null || meta === undefined
          ? Prisma.JsonNull
          : (meta as Prisma.InputJsonValue),
      },
    });
    await this.audit.record({
      action: 'product.option.value.create',
      actorId: user.id,
      target: productId,
      metadata: { optionId, code: dto.code, label: dto.label, priceDeltaCents: dto.priceDeltaCents },
      ip: req.ip ?? '',
    });
    return value;
  }

  @Patch(':id/options/:optionId/values/:valueId')
  async updateOptionValue(
    @Param('id') productId: string,
    @Param('optionId') optionId: string,
    @Param('valueId') valueId: string,
    @Body(new ZodValidationPipe(UpdateOptionValueSchema)) dto: UpdateOptionValueDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const { meta, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (meta !== undefined) {
      data.meta = meta === null ? Prisma.JsonNull : (meta as Prisma.InputJsonValue);
    }
    const value = await this.prisma.productOptionValue.update({
      where: { id: valueId, optionId },
      data,
    });
    await this.audit.record({
      action: 'product.option.value.update',
      actorId: user.id,
      target: productId,
      metadata: { optionId, valueId, changes: dto },
      ip: req.ip ?? '',
    });
    return value;
  }

  @Delete(':id/options/:optionId/values/:valueId')
  @HttpCode(204)
  async deleteOptionValue(
    @Param('id') productId: string,
    @Param('optionId') optionId: string,
    @Param('valueId') valueId: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    await this.prisma.productOptionValue.delete({
      where: { id: valueId, optionId },
    });
    await this.audit.record({
      action: 'product.option.value.delete',
      actorId: user.id,
      target: productId,
      metadata: { optionId, valueId },
      ip: req.ip ?? '',
    });
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
