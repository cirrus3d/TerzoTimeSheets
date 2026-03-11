import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

function getReadonlyStoreSlugs() {
  const raw = process.env.READONLY_STORE_PASSWORDS_JSON;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed)
      .map((key) =>
        key
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasReadonlyCookie = Boolean(request.cookies.get('readonly_timesheets_session')?.value);

  if (hasReadonlyCookie) {
    const slugs = getReadonlyStoreSlugs();
    const segments = pathname.split('/').filter(Boolean);
    const isSingleSegmentStoreSlugPath =
      segments.length === 1 && slugs.includes(segments[0].toLowerCase());

    const isAllowedPath =
      pathname === '/readonly-timesheets' ||
      isSingleSegmentStoreSlugPath ||
      pathname.startsWith('/api/readonly-timesheets') ||
      pathname.startsWith('/api/readonly-auth/stores') ||
      pathname.startsWith('/api/readonly-auth/login') ||
      pathname.startsWith('/api/readonly-auth/logout');

    if (!isAllowedPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden for readonly session' }, { status: 403 });
      }

      return NextResponse.redirect(new URL('/readonly-timesheets', request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
