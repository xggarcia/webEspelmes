import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all locale-prefixed routes, excluding api/_next/static/favicon.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};

