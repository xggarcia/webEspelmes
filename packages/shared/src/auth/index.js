"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetSchema = exports.ForgotSchema = exports.LoginSchema = exports.RegisterSchema = exports.RoleSchema = void 0;
const zod_1 = require("zod");
exports.RoleSchema = zod_1.z.enum(['CUSTOMER', 'ADMIN']);
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(200).toLowerCase(),
    password: zod_1.z.string().min(10).max(128),
    name: zod_1.z.string().min(1).max(120),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(200).toLowerCase(),
    password: zod_1.z.string().min(1).max(128),
});
exports.ForgotSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(200).toLowerCase(),
});
exports.ResetSchema = zod_1.z.object({
    token: zod_1.z.string().min(20).max(300),
    password: zod_1.z.string().min(10).max(128),
});
//# sourceMappingURL=index.js.map