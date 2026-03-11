import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ReadonlyAccessForm } from '@/components/readonly/ReadonlyAccessForm';
import { ReadonlyTimesheetsViewer } from '@/components/readonly/ReadonlyTimesheetsViewer';
import { toStoreSlug, parseReadonlySessionToken } from '@/lib/auth/readonly';
import { createAdminClient } from '@/lib/supabase/admin';

const COOKIE_NAME = 'readonly_timesheets_session';
const RESERVED_SLUGS = new Set(['dashboard', 'reports', 'earnings', 'management', 'audit', 'api', 'test']);

interface StoreRow {
  id: string;
  name: string;
}

interface StoreSlugPageProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreSlugPage({ params }: StoreSlugPageProps) {
  const { storeSlug } = await params;
  const normalizedSlug = (storeSlug || '').toLowerCase();

  if (!normalizedSlug || RESERVED_SLUGS.has(normalizedSlug)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data: stores, error } = await supabase.from('stores').select('id, name');

  if (error || !stores) {
    notFound();
  }

  const store = (stores as StoreRow[]).find((row) => toStoreSlug(row.name) === normalizedSlug);

  if (!store) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = parseReadonlySessionToken(token);

  if (session?.storeId === store.id) {
    return <ReadonlyTimesheetsViewer storeId={store.id} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <ReadonlyAccessForm fixedStoreId={store.id} fixedStoreName={store.name} />
    </div>
  );
}
