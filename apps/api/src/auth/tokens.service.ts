import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AccessPayload = { sub: string; email: string; role: 'CUSTOMER' | 'ADMIN' };
export type RefreshPayload = { sub: string; jti: string; fam: string };

const ms = (s: string): number => {
  const m = /^(\d+)([smhd])$/.exec(s.trim());
  if (!m) return 900_000;
  const n = Number(m[1]);
  const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
  return n * mult;
};

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  signAccess(payload: AccessPayload): { token: string; expiresAt: Date } {
    const ttl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const token = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: ttl,
    });
    return { token, expiresAt: new Date(Date.now() + ms(ttl)) };
  }

  async issueRefreshToken(
    userId: string,
    familyId: string | null,
    ua: string | undefined,
    ip: string | undefined,
  ): Promise<{ token: string; expiresAt: Date; familyId: string; jti: string }> {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const expiresAt = new Date(Date.now() + ms(ttl));
    const fam = familyId ?? crypto.randomUUID();
    const jti = crypto.randomUUID();
    const payload: RefreshPayload = { sub: userId, jti, fam };
    const token = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: ttl,
    });
    const tokenHash = this.hash(token);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: fam,
        expiresAt,
        userAgent: ua ?? null,
        ip: ip ?? null,
      },
    });
    return { token, expiresAt, familyId: fam, jti };
  }

  async rotate(
    currentToken: string,
    userId: string,
    familyId: string,
    ua: string | undefined,
    ip: string | undefined,
  ): Promise<{ token: string; expiresAt: Date }> {
    const currentHash = this.hash(currentToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash: currentHash } });

    if (!existing || existing.userId !== userId || existing.familyId !== familyId) {
      await this.revokeFamily(familyId);
      throw new Error('Refresh token invalid');
    }
    if (existing.revokedAt) {
      // Re-use detected — revoke the whole family.
      await this.revokeFamily(familyId);
      throw new Error('Refresh token re-use detected');
    }
    if (existing.expiresAt.getTime() < Date.now()) {
      throw new Error('Refresh token expired');
    }

    const next = await this.issueRefreshToken(userId, familyId, ua, ip);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedBy: this.hash(next.token) },
    });
    return next;
  }

  async revokeByToken(token: string): Promise<void> {
    const tokenHash = this.hash(token);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
