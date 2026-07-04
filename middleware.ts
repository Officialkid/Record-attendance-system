import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const mustChangePassword = req.nextauth.token?.mustChangePassword;
    const systemRole = req.nextauth.token?.systemRole;
    const departmentIds = req.nextauth.token?.departmentIds || [];
    const status = req.nextauth.token?.status;
    const pathname = req.nextUrl.pathname;
    const isSystemAdmin = systemRole === 'main_admin' || systemRole === 'chief_admin';

    if (pathname === '/leadership') {
      return NextResponse.redirect(new URL('/oversight', req.url));
    }

    if (mustChangePassword && pathname !== '/settings/profile') {
      return NextResponse.redirect(new URL('/settings/profile', req.url));
    }

    if (
      !isSystemAdmin &&
      status === 'pending' &&
      departmentIds.length === 0 &&
      pathname !== '/dashboard' &&
      pathname !== '/settings/profile' &&
      pathname !== '/docs'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'cap-development-secret',
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/records/:path*',
    '/insights/:path*',
    '/meetings/:path*',
    '/programs/:path*',
    '/leadership/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/add-attendance/:path*',
    '/view-analytics/:path*',
    '/analytics/:path*',
    '/visitors/:path*',
    '/notifications/:path*',
    '/docs/:path*',
    '/help/:path*',
  ],
};
