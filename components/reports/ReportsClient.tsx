'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WeeklyReport } from '@/components/reports/WeeklyReport';
import { MonthlyReport } from '@/components/reports/MonthlyReport';
import { MonthlyReportPerDay } from '@/components/reports/MonthlyReportPerDay';
import { Button } from '@/components/ui/Button';

type ViewMode = 'weekly' | 'monthly' | 'monthlyPerDay';

export function ReportsClient() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const viewModes: { key: ViewMode; label: string }[] = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly Totals' },
    { key: 'monthlyPerDay', label: 'Monthly Per Day' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onStoreChange={setSelectedStoreId} currentPage="reports" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h2>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            {viewModes.map((mode) => (
              <Button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                variant={viewMode === mode.key ? 'primary' : 'secondary'}
                className="px-2 text-sm sm:px-4 sm:text-base"
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        {viewMode === 'weekly' ? (
          <WeeklyReport selectedStoreId={selectedStoreId} />
        ) : viewMode === 'monthly' ? (
          <MonthlyReport selectedStoreId={selectedStoreId} />
        ) : (
          <MonthlyReportPerDay selectedStoreId={selectedStoreId} />
        )}
      </main>
    </div>
  );
}
