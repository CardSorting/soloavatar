/**
 * Next.js Middleware
 * Handles service worker requests and other edge cases
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle service worker requests - return 204 No Content
  // This prevents 404 errors when browsers check for service workers
  if (pathname === '/sw.js' || pathname === '/service-worker.js') {
    return new NextResponse(null, { status: 204 });
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sw.js',
    '/service-worker.js',
  ],
};

