import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { RefreshPayload } from '../tokens.service';

const refreshCookieExtractor = (req: Request): string | null => {
  const raw = req?.cookies?.refresh_token;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshCookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshPayload) {
    if (!payload?.sub || !payload.fam) throw new UnauthorizedException();
    const token = req.cookies?.refresh_token;
    return { id: payload.sub, familyId: payload.fam, jti: payload.jti, refreshToken: token };
  }
}
