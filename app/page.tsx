import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="text-center text-sm text-gray-600 mt-4">
          Need readonly access?{' '}
          <Link href="/readonly-timesheets" className="text-blue-700 hover:text-blue-800 font-medium">
            Open readonly timesheets
          </Link>
        </p>
      </div>
    </div>
  );
}
