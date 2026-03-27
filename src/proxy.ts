import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from './types';

const ROLE_PROTECTED: Record<string, Role[]> = {
  '/users':    ['Admin'],
  '/reports':  ['Admin', 'SalesHead', 'VH'],
  '/org':      ['Admin', 'SalesHead', 'VH'],
};

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role as Role | undefined;

    for (const [path, allowedRoles] of Object.entries(ROLE_PROTECTED)) {
      if (pathname.startsWith(path) && role && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/metrics/:path*',
    '/targets/:path*',
    '/team/:path*',
    '/deals/:path*',
    '/org/:path*',
    '/users/:path*',
    '/incentives/:path*',
    '/reports/:path*',
    '/api/users/:path*',
    '/api/targets/:path*',
    '/api/sales/:path*',
    '/api/commission/:path*',
  ],
};
