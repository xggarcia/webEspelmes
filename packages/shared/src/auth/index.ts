import { z } from 'zod';

export const RoleSchema = z.enum(['CUSTOMER', 'ADMIN']);
export type Role = z.infer<typeof RoleSchema>;

export const RegisterSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
  password: z.string().min(10).max(128),
  name: z.string().min(1).max(120),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
});

export const ResetSchema = z.object({
  token: z.string().min(20).max(300),
  password: z.string().min(10).max(128),
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
};
