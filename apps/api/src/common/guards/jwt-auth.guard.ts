import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Admin token header bypass — lets the Next.js server call admin API
    // routes without a user JWT session.
    const adminToken = req.headers['x-admin-token'] as string | undefined;
    const expectedToken = process.env.ADMIN_TOKEN;
    if (adminToken && expectedToken && adminToken === expectedToken) {
      req.user = { id: 'admin-token', email: 'admin@internal', role: 'ADMIN' };
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) return super.canActivate(context) as Promise<boolean>;

    // Public route: attempt JWT extraction silently so req.user is populated
    // when a valid token is present, but never block the request.
    try {
      await (super.canActivate(context) as Promise<boolean>);
    } catch {
      // No token or invalid token — fine for public routes
    }
    return true;
  }
}
