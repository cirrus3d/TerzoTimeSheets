'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DailyTimesheet } from '@/components/timesheet/DailyTimesheet';

export function DashboardClient() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onStoreChange={setSelectedStoreId} currentPage="dashboard" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyTimesheet selectedStoreId={selectedStoreId} />
      </main>
    </div>
  );
}
