import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  ForgotSchema,
  LoginSchema,
  RegisterSchema,
  ResetSchema,
  type LoginInput,
  type RegisterInput,
} from '@espelmes/shared';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';

function cookieOpts() {
  const secure = process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    sameSite: (secure ? 'none' : 'lax') as 'lax' | 'none',
    secure,
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    path: '/',
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
  ) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.register(dto);
    return this.issueSession(user, req, res);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validate(dto);
    return this.issueSession(user, req, res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { id, familyId, refreshToken } = req.user as {
      id: string;
      familyId: string;
      refreshToken: string;
    };
    const ua = req.headers['user-agent'];
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    const next = await this.tokens.rotate(refreshToken, id, familyId, ua, ip);
    const user = await this.auth.getMe(id);
    const access = this.tokens.signAccess({ sub: user.id, email: user.email, role: user.role });

    res.cookie('access_token', access.token, { ...cookieOpts(), maxAge: access.expiresAt.getTime() - Date.now() });
    res.cookie('refresh_token', next.token, { ...cookieOpts(), maxAge: next.expiresAt.getTime() - Date.now() });
    return { user, accessToken: access.token, accessTokenExpiresAt: access.expiresAt.toISOString() };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (token) await this.tokens.revokeByToken(token);
    res.clearCookie('access_token', cookieOpts());
    res.clearCookie('refresh_token', cookieOpts());
  }

  @Public()
  @Throttle({ auth: { limit: 3, ttl: 60_000 } })
  @Post('forgot')
  async forgot(@Body(new ZodValidationPipe(ForgotSchema)) dto: { email: string }) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('reset')
  async reset(@Body(new ZodValidationPipe(ResetSchema)) dto: { token: string; password: string }) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    return this.auth.getMe(user.id);
  }

  private async issueSession(
    user: { id: string; email: string; name: string; role: 'CUSTOMER' | 'ADMIN' },
    req: Request,
    res: Response,
  ) {
    const ua = req.headers['user-agent'];
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const access = this.tokens.signAccess({ sub: user.id, email: user.email, role: user.role });
    const refresh = await this.tokens.issueRefreshToken(user.id, null, ua, ip);

    res.cookie('access_token', access.token, { ...cookieOpts(), maxAge: access.expiresAt.getTime() - Date.now() });
    res.cookie('refresh_token', refresh.token, { ...cookieOpts(), maxAge: refresh.expiresAt.getTime() - Date.now() });

    return { user, accessToken: access.token, accessTokenExpiresAt: access.expiresAt.toISOString() };
  }
}
