import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { StoreManagement } from '@/components/management/StoreManagement';
import { EmployeeManagement } from '@/components/management/EmployeeManagement';
import Link from 'next/link';

export default async function ManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">TerzoTimeSheets</h1>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-gray-200 text-gray-900 hover:bg-gray-300"
              >
                Timesheet
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StoreManagement />
        <EmployeeManagement />
      </main>
    </div>
  );
}
