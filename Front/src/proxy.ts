import { NextResponse, type NextRequest } from 'next/server';
import { firmarIP } from './lib/proxy-firma';
export function proxy(request: NextRequest) {
  return NextResponse.next({
    request: { headers: firmarIP(request.headers, request.method, request.nextUrl.pathname) },
  });
}
export const config = { matcher: '/api/:path*' };
