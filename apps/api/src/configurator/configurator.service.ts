import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ConfiguratorStateSchema,
  type ConfiguratorPatch,
  type ConfiguratorServerState,
  type ConfiguratorState,
} from '@espelmes/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PricingEngine, type LoadedProduct } from './pricing.engine';

@Injectable()
export class ConfiguratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingEngine,
  ) {}

  async loadProduct(productId: string): Promise<LoadedProduct> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { options: { include: { values: true } } },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }
    return product;
  }

  buildInitialState(product: LoadedProduct): ConfiguratorState {
    const firstOf = (kind: string): string | undefined =>
      product.options.find((o) => o.kind === (kind as never))?.values[0]?.code;

    const colorOpt = product.options.find((o) => o.kind === 'color');
    const firstColor = colorOpt?.values[0];
    const firstColorHex =
      (firstColor?.meta as { hex?: string } | null)?.hex ?? '#F3E3C3';

    const raw: ConfiguratorState = {
      productId: product.id,
      shape: (firstOf('shape') as ConfiguratorState['shape']) ?? 'pillar',
      sizeCode: firstOf('size') ?? 'M',
      color: { hex: firstColorHex, name: firstColor?.label },
      finish: (firstOf('finish') as ConfiguratorState['finish']) ?? 'matte',
      platform: (firstOf('platform') as ConfiguratorState['platform']) ?? 'none',
      label: { text: '', font: 'serif', color: '#2B201A' },
      accessories: [],
      quantity: 1,
    };
    return ConfiguratorStateSchema.parse(raw);
  }

  mergePatch(current: ConfiguratorState, patch: ConfiguratorPatch): ConfiguratorState {
    const merged = {
      ...current,
      ...patch,
      label: patch.label ? { ...current.label, ...patch.label } : current.label,
      color: patch.color ? { ...current.color, ...patch.color } : current.color,
      accessories: patch.accessories ?? current.accessories,
    };
    const result = ConfiguratorStateSchema.safeParse(merged);
    if (!result.success) {
      throw new BadRequestException({
        code: 'INVALID_CONFIGURATION',
        message: 'Invalid configurator state',
        details: result.error.flatten(),
      });
    }
    return result.data;
  }

  async quote(state: ConfiguratorState): Promise<ConfiguratorServerState> {
    const product = await this.loadProduct(state.productId);
    const pricing = this.pricing.compute(product, state);
    const remaining = product.stock;
    const need = state.quantity;
    const inStock = remaining >= need;

    const warnings = [...pricing.warnings];
    if (!inStock) warnings.push(`Only ${remaining} in stock`);

    return {
      state,
      price: {
        unitCents: pricing.unitCents,
        totalCents: pricing.totalCents,
        breakdown: pricing.breakdown,
      },
      availability: { inStock, remaining },
      warnings,
    };
  }
}
