/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@espelmes.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const adminName = process.env.ADMIN_NAME ?? 'Administradora';

  // --- Admin user ---
  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: adminName, role: 'ADMIN', passwordHash },
    update: { role: 'ADMIN', name: adminName, passwordHash },
  });

  // --- Shipping zones (EUR cents) ---
  const zones = [
    { code: 'ES_PEN', name: 'Península', priceCents: 490 },
    { code: 'ES_BAL', name: 'Illes Balears', priceCents: 790 },
    { code: 'ES_CAN', name: 'Canàries / Ceuta / Melilla', priceCents: 1290 },
  ];
  for (const z of zones) {
    await prisma.shippingZone.upsert({ where: { code: z.code }, create: z, update: z });
  }

  // --- Categories ---
  const categories = [
    { slug: 'espelmes', name: 'Espelmes', description: 'Espelmes artesanes per cada moment.' },
    { slug: 'decoracio', name: 'Decoració', description: 'Peces decoratives per a casa i esdeveniments.' },
  ];
  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i },
      update: { ...c, sortOrder: i },
    });
  }

  const catEspelmes = await prisma.category.findUniqueOrThrow({ where: { slug: 'espelmes' } });
  const catDecoracio = await prisma.category.findUniqueOrThrow({ where: { slug: 'decoracio' } });

  // --- Products ---
  const products = [
    {
      slug: 'vespres-de-lavanda',
      name: 'Vespres de lavanda',
      shortDescription: 'Lavanda del Prepirineu, cera de soja.',
      description:
        "Una espelma que porta la calma dels camps de lavanda a casa teva. Mecha de cotó i cera de soja cultivada amb cura.",
      basePriceCents: 1800,
      stock: 24,
      categoryId: catEspelmes.id,
      heroImageUrl: null,
    },
    {
      slug: 'taronger-en-flor',
      name: 'Taronger en flor',
      shortDescription: "Cítric, floral, com una matinada d'abril.",
      description: 'Olor viva i neta, pensada per a matins tranquils.',
      basePriceCents: 1900,
      stock: 18,
      categoryId: catEspelmes.id,
      heroImageUrl: null,
    },
    {
      slug: 'pilar-rosa-palo',
      name: 'Pilar rosa pàl·lid',
      shortDescription: 'Columna clàssica, to terrós i elegant.',
      description: 'Per a centres de taula i racons especials.',
      basePriceCents: 2200,
      stock: 30,
      categoryId: catDecoracio.id,
      heroImageUrl: null,
    },
    {
      slug: 'espelma-personalitzable',
      name: 'Espelma personalitzable',
      shortDescription: 'Tria forma, color, acabat i etiqueta.',
      description:
        'Disseny la teva espelma al configurador en directe. Ideal per a regals, casaments i celebracions.',
      basePriceCents: 2400,
      stock: 100,
      categoryId: catEspelmes.id,
      heroImageUrl: null,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });

    // --- Options per product (only customizable one gets full set) ---
    if (p.slug !== 'espelma-personalitzable') continue;

    await prisma.productOption.deleteMany({ where: { productId: product.id } });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'shape',
        label: 'Forma',
        required: true,
        sortOrder: 0,
        values: {
          create: [
            { code: 'pillar', label: 'Columna', sortOrder: 0 },
            { code: 'votive', label: 'Votiva', sortOrder: 1 },
            { code: 'container', label: 'En pot', priceDeltaCents: 300, sortOrder: 2 },
            { code: 'heart', label: 'Cor', priceDeltaCents: 500, sortOrder: 3 },
            { code: 'sphere', label: 'Esfera', priceDeltaCents: 400, sortOrder: 4 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'size',
        label: 'Mida',
        required: true,
        sortOrder: 1,
        values: {
          create: [
            { code: 'S', label: 'Petita', priceDeltaCents: 0, sortOrder: 0 },
            { code: 'M', label: 'Mitjana', priceDeltaCents: 400, sortOrder: 1 },
            { code: 'L', label: 'Gran', priceDeltaCents: 900, sortOrder: 2 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'color',
        label: 'Color',
        required: true,
        sortOrder: 2,
        values: {
          create: [
            { code: 'ivory', label: 'Ivori', meta: { hex: '#F3E3C3' }, sortOrder: 0 },
            { code: 'clay', label: 'Argila', meta: { hex: '#B86E4B' }, sortOrder: 1 },
            { code: 'sage', label: 'Sàlvia', meta: { hex: '#8A9A7B' }, sortOrder: 2 },
            { code: 'ember', label: 'Brasa', meta: { hex: '#8A3A1E' }, sortOrder: 3 },
            { code: 'ink', label: 'Tinta', meta: { hex: '#2B201A' }, sortOrder: 4 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'finish',
        label: 'Acabat',
        required: true,
        sortOrder: 3,
        values: {
          create: [
            { code: 'matte', label: 'Mat', sortOrder: 0 },
            { code: 'glossy', label: 'Brillant', priceDeltaCents: 200, sortOrder: 1 },
            { code: 'pearl', label: 'Perlat', priceDeltaCents: 400, sortOrder: 2 },
            { code: 'textured', label: 'Texturat', priceDeltaCents: 300, sortOrder: 3 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'platform',
        label: 'Base',
        required: false,
        sortOrder: 4,
        values: {
          create: [
            { code: 'none', label: 'Sense base', sortOrder: 0 },
            { code: 'wood', label: 'Fusta', priceDeltaCents: 300, sortOrder: 1 },
            { code: 'ceramic', label: 'Ceràmica', priceDeltaCents: 500, sortOrder: 2 },
            { code: 'metal', label: 'Metall', priceDeltaCents: 600, sortOrder: 3 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'label',
        label: 'Etiqueta personalitzada',
        required: false,
        sortOrder: 5,
        values: {
          create: [
            { code: 'none', label: 'Sense etiqueta', sortOrder: 0 },
            { code: 'text', label: 'Text a mida', priceDeltaCents: 200, sortOrder: 1 },
          ],
        },
      },
    });

    await prisma.productOption.create({
      data: {
        productId: product.id,
        kind: 'accessory',
        label: 'Decoracions',
        required: false,
        sortOrder: 6,
        values: {
          create: [
            { code: 'dried-flowers', label: 'Flors seques', priceDeltaCents: 300, sortOrder: 0 },
            { code: 'ribbon', label: 'Cinta de lli', priceDeltaCents: 100, sortOrder: 1 },
            { code: 'gold-leaf', label: "Fulla d'or", priceDeltaCents: 500, sortOrder: 2 },
          ],
        },
      },
    });
  }

  // Reassign any existing products that still point to legacy categories,
  // then remove those categories safely.
  await prisma.product.updateMany({
    where: { category: { slug: { in: ['aromatiques', 'personalitzades'] } } },
    data: { categoryId: catEspelmes.id },
  });
  await prisma.product.updateMany({
    where: { category: { slug: 'decoratives' } },
    data: { categoryId: catDecoracio.id },
  });
  await prisma.category.deleteMany({
    where: { slug: { in: ['aromatiques', 'decoratives', 'personalitzades'] } },
  });

  console.info('✔ Seed completed. Admin:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
