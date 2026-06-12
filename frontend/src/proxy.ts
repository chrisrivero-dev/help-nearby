import { NextRequest, NextResponse } from 'next/server';

// Dev mode - disable auth check
const IS_DEV = process.env.NEXT_PUBLIC_ENV === 'development';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Don't protect API routes, static files, the root path, or the public
  // embed widget and its demo pages (they must load inside third-party
  // iframes with no auth cookie).
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path === '/' ||
    path.startsWith('/fonts') ||
    path.startsWith('/images') ||
    path.startsWith('/embed') ||
    path.startsWith('/demo')
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
