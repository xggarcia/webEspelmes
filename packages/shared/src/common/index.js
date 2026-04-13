"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centsToEuro = exports.IdSchema = exports.PageQuerySchema = exports.MoneySchema = exports.LocaleSchema = void 0;
const zod_1 = require("zod");
exports.LocaleSchema = zod_1.z.enum(['ca', 'es']);
exports.MoneySchema = zod_1.z.object({
    amount: zod_1.z.number().int().nonnegative(), // cents
    currency: zod_1.z.literal('EUR').default('EUR'),
});
exports.PageQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(60).default(12),
    sort: zod_1.z.enum(['new', 'price_asc', 'price_desc', 'popular']).default('new'),
});
exports.IdSchema = zod_1.z.string().cuid2().or(zod_1.z.string().uuid()).or(zod_1.z.string().min(1));
const centsToEuro = (cents) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
exports.centsToEuro = centsToEuro;
//# sourceMappingURL=index.js.map