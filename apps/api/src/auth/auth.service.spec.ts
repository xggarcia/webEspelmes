import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService (unit)', () => {
  let service: AuthService;
  const users = new Map<string, { id: string; email: string; name: string; passwordHash: string; role: 'CUSTOMER' | 'ADMIN' }>();

  const prismaMock = {
    user: {
      findUnique: jest.fn(async ({ where }: any) => users.get(where.email) ?? null),
      create: jest.fn(async ({ data }: any) => {
        const u = { id: `u_${users.size + 1}`, ...data };
        users.set(data.email, u);
        return u;
      }),
    },
    passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };

  beforeEach(async () => {
    users.clear();
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TokensService, useValue: {} },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  it('registers a new customer with hashed password', async () => {
    const u = await service.register({
      email: 'test@x.com',
      password: 'strong-password-1!',
      name: 'Test',
    });
    expect(u.role).toBe('CUSTOMER');
    const stored = users.get('test@x.com');
    expect(await argon2.verify(stored!.passwordHash, 'strong-password-1!')).toBe(true);
  });

  it('rejects duplicate email', async () => {
    await service.register({ email: 't@x.com', password: 'strong-password-1!', name: 'A' });
    await expect(
      service.register({ email: 't@x.com', password: 'strong-password-1!', name: 'B' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates correct credentials', async () => {
    await service.register({ email: 'l@x.com', password: 'strong-password-1!', name: 'L' });
    const u = await service.validate({ email: 'l@x.com', password: 'strong-password-1!' });
    expect(u.email).toBe('l@x.com');
  });

  it('rejects wrong password', async () => {
    await service.register({ email: 'w@x.com', password: 'strong-password-1!', name: 'W' });
    await expect(service.validate({ email: 'w@x.com', password: 'nope' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
