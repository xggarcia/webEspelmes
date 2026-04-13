"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@espelmes.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe!2026';
    const adminName = process.env.ADMIN_NAME ?? 'Administradora';
    // --- Admin user ---
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await prisma.user.upsert({
        where: { email: adminEmail },
        create: { email: adminEmail, name: adminName, role: 'ADMIN', passwordHash },
        update: { role: 'ADMIN', name: adminName },
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
        { slug: 'aromatiques', name: 'Aromàtiques', description: "Amb olis essencials i aromes suaus." },
        { slug: 'decoratives', name: 'Decoratives', description: 'Formes i colors per il·luminar la llar.' },
        { slug: 'personalitzades', name: 'Personalitzades', description: 'Fetes a mida per a tu.' },
    ];
    for (const [i, c] of categories.entries()) {
        await prisma.category.upsert({
            where: { slug: c.slug },
            create: { ...c, sortOrder: i },
            update: { ...c, sortOrder: i },
        });
    }
    const catAroma = await prisma.category.findUniqueOrThrow({ where: { slug: 'aromatiques' } });
    const catDeco = await prisma.category.findUniqueOrThrow({ where: { slug: 'decoratives' } });
    const catPers = await prisma.category.findUniqueOrThrow({ where: { slug: 'personalitzades' } });
    // --- Products ---
    const products = [
        {
            slug: 'vespres-de-lavanda',
            name: 'Vespres de lavanda',
            shortDescription: 'Lavanda del Prepirineu, cera de soja.',
            description: "Una espelma que porta la calma dels camps de lavanda a casa teva. Mecha de cotó i cera de soja cultivada amb cura.",
            basePriceCents: 1800,
            stock: 24,
            categoryId: catAroma.id,
            heroImageUrl: null,
        },
        {
            slug: 'taronger-en-flor',
            name: 'Taronger en flor',
            shortDescription: "Cítric, floral, com una matinada d'abril.",
            description: 'Olor viva i neta, pensada per a matins tranquils.',
            basePriceCents: 1900,
            stock: 18,
            categoryId: catAroma.id,
            heroImageUrl: null,
        },
        {
            slug: 'pilar-rosa-palo',
            name: 'Pilar rosa pàl·lid',
            shortDescription: 'Columna clàssica, to terrós i elegant.',
            description: 'Per a centres de taula i racons especials.',
            basePriceCents: 2200,
            stock: 30,
            categoryId: catDeco.id,
            heroImageUrl: null,
        },
        {
            slug: 'espelma-personalitzable',
            name: 'Espelma personalitzable',
            shortDescription: 'Tria forma, color, acabat i etiqueta.',
            description: 'Disseny la teva espelma al configurador en directe. Ideal per a regals, casaments i celebracions.',
            basePriceCents: 2400,
            stock: 100,
            categoryId: catPers.id,
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
        if (p.slug !== 'espelma-personalitzable')
            continue;
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
//# sourceMappingURL=seed.js.map