import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReportsClient } from '@/components/reports/ReportsClient';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/');
  }

  return <ReportsClient />;
}
