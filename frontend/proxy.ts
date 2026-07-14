import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard', '/members', '/flats', '/maintenance',
  '/complaints', '/visitors', '/notices', '/accounts',
  '/reports', '/documents', '/settings', '/users',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isLoginPage = pathname.startsWith('/login');

  // Check accessToken cookie (set by authStore.setAuth)
  const hasToken = request.cookies.has('accessToken');

  // Not logged in → redirect to login
  if (isProtected && !hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → skip login page
 if (isLoginPage && hasToken) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
