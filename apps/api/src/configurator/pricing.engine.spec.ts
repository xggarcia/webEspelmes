import { PricingEngine, type LoadedProduct } from './pricing.engine';
import type { ConfiguratorState } from '@espelmes/shared';

function mkProduct(): LoadedProduct {
  return {
    id: 'p1',
    slug: 'pers',
    name: 'Personalitzable',
    shortDescription: '',
    description: '',
    basePriceCents: 2000,
    vatRate: 0.21,
    stock: 10,
    isCustomizable: true,
    isActive: true,
    heroImageUrl: null,
    categoryId: 'c1',
    createdAt: new Date(),
    updatedAt: new Date(),
    options: [
      {
        id: 'o-size',
        productId: 'p1',
        kind: 'size',
        name: 'Mida',
        required: true,
        createdAt: new Date(),
        values: [
          opt('M', 'M', 0),
          opt('L', 'L', 300),
        ],
      },
      {
        id: 'o-finish',
        productId: 'p1',
        kind: 'finish',
        name: 'Acabat',
        required: true,
        createdAt: new Date(),
        values: [
          opt('matte', 'Mat', 0),
          opt('pearl', 'Perlat', 150),
        ],
      },
      {
        id: 'o-color',
        productId: 'p1',
        kind: 'color',
        name: 'Color',
        required: true,
        createdAt: new Date(),
        values: [
          opt('rose', 'Rosa', 0, { hex: '#F3E3C3' }),
          opt('gold', 'Or', 250, { hex: '#C9A24D' }),
        ],
      },
      {
        id: 'o-label',
        productId: 'p1',
        kind: 'label',
        name: 'Etiqueta',
        required: false,
        createdAt: new Date(),
        values: [opt('text', 'Text personalitzat', 200)],
      },
      {
        id: 'o-acc',
        productId: 'p1',
        kind: 'accessory',
        name: 'Complement',
        required: false,
        createdAt: new Date(),
        values: [opt('flower', 'Flor seca', 180), opt('ribbon', 'Cinta', 90)],
      },
      {
        id: 'o-platform',
        productId: 'p1',
        kind: 'platform',
        name: 'Base',
        required: false,
        createdAt: new Date(),
        values: [opt('none', 'Cap', 0), opt('wood', 'Fusta', 400)],
      },
      {
        id: 'o-shape',
        productId: 'p1',
        kind: 'shape',
        name: 'Forma',
        required: true,
        createdAt: new Date(),
        values: [opt('pillar', 'Pilar', 0)],
      },
    ],
  } as unknown as LoadedProduct;
}

function opt(code: string, label: string, deltaCents: number, meta: object | null = null) {
  return {
    id: `v-${code}`,
    optionId: 'x',
    code,
    label,
    priceDeltaCents: deltaCents,
    sortOrder: 0,
    meta,
    createdAt: new Date(),
  } as unknown as import('@prisma/client').ProductOptionValue;
}

function mkState(overrides: Partial<ConfiguratorState> = {}): ConfiguratorState {
  return {
    shape: 'pillar',
    sizeCode: 'M',
    color: { hex: '#F3E3C3' },
    finish: 'matte',
    platform: 'none',
    label: { text: '', font: 'serif', color: '#2B201A' },
    accessories: [],
    quantity: 1,
    ...overrides,
  } as ConfiguratorState;
}

describe('PricingEngine', () => {
  const engine = new PricingEngine();

  it('base-only pricing when no deltas apply', () => {
    const r = engine.compute(mkProduct(), mkState());
    expect(r.unitCents).toBe(2000);
    expect(r.totalCents).toBe(2000);
    expect(r.breakdown).toEqual([{ label: 'Base', amountCents: 2000 }]);
    expect(r.warnings).toEqual([]);
  });

  it('adds size, finish, color, label and accessory deltas', () => {
    const r = engine.compute(
      mkProduct(),
      mkState({
        sizeCode: 'L',
        finish: 'pearl',
        color: { hex: '#C9A24D' },
        label: { text: 'Laia', font: 'serif', color: '#000000' },
        accessories: ['flower', 'ribbon'],
        quantity: 2,
      }),
    );
    // 2000 base + 300 size + 150 finish + 250 color + 200 label + 180 flower + 90 ribbon
    expect(r.unitCents).toBe(3170);
    expect(r.totalCents).toBe(6340);
    const labels = r.breakdown.map((b) => b.label);
    expect(labels).toContain('Size: L');
    expect(labels).toContain('Finish: Perlat');
    expect(labels).toContain('Color: Or');
    expect(labels).toContain('Personalised label');
    expect(r.warnings).toEqual([]);
  });

  it('warns on unknown size code but still prices base', () => {
    const r = engine.compute(mkProduct(), mkState({ sizeCode: 'XXL' }));
    expect(r.unitCents).toBe(2000);
    expect(r.warnings.some((w) => w.includes('Size'))).toBe(true);
  });

  it('ignores label delta when text is whitespace-only', () => {
    const r = engine.compute(
      mkProduct(),
      mkState({ label: { text: '   ', font: 'serif', color: '#000' } }),
    );
    expect(r.unitCents).toBe(2000);
  });

  it('color hex match is case-insensitive', () => {
    const r = engine.compute(mkProduct(), mkState({ color: { hex: '#c9a24d' } }));
    expect(r.unitCents).toBe(2250);
  });

  it('quantity multiplies totalCents only', () => {
    const r = engine.compute(mkProduct(), mkState({ quantity: 5 }));
    expect(r.unitCents).toBe(2000);
    expect(r.totalCents).toBe(10000);
  });
});
