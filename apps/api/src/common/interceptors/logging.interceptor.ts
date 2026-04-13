import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const started = Date.now();
    const method = req?.method;
    const url = req?.url;
    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - started;
          if (ms > 400) this.logger.warn(`${method} ${url} ${ms}ms (slow)`);
        },
      }),
    );
  }
}
