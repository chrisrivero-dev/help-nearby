import { NextRequest, NextResponse } from 'next/server';

// Dev mode - disable auth check
const IS_DEV = process.env.NEXT_PUBLIC_ENV === 'development';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Don't protect API routes, static files, or the root path
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path === '/' ||
    path.startsWith('/fonts') ||
    path.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Dev mode: allow all requests without auth
  if (IS_DEV) {
    return NextResponse.next();
  }

  // Production mode: check auth token from cookies
  const token = request.cookies.get('authToken')?.value;

  // If no token, redirect to landing page
  if (!token) {
    const url = new URL('/', request.url);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }

  // Token exists, allow request
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|fonts|images|favicon.ico).*)'],
};
