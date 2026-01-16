import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuditClient } from '@/components/audit/AuditClient';

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/');
  }

  return <AuditClient />;
}
