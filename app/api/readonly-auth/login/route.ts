import { NextResponse } from 'next/server';
import { createReadonlySessionToken, verifyReadonlyPasswordForStore } from '@/lib/auth/readonly';
import { createAdminClient } from '@/lib/supabase/admin';

const COOKIE_NAME = 'readonly_timesheets_session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';
    const storeId = typeof body?.storeId === 'string' ? body.storeId : '';

    if (!storeId) {
      return NextResponse.json({ error: 'Store is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Invalid store' }, { status: 400 });
    }

    if (!verifyReadonlyPasswordForStore(store.id, store.name, password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, createReadonlySessionToken(store.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to sign in' }, { status: 500 });
  }
}
