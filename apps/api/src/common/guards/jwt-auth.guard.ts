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
