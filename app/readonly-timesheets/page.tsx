import { cookies } from 'next/headers';
import { ReadonlyAccessForm } from '@/components/readonly/ReadonlyAccessForm';
import { ReadonlyTimesheetsViewer } from '@/components/readonly/ReadonlyTimesheetsViewer';
import { parseReadonlySessionToken } from '@/lib/auth/readonly';

const COOKIE_NAME = 'readonly_timesheets_session';

export default async function ReadonlyTimesheetsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = parseReadonlySessionToken(token);

  if (session) {
    return <ReadonlyTimesheetsViewer storeId={session.storeId} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <ReadonlyAccessForm />
    </div>
  );
}
