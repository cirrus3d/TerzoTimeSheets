'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WeeklyReport } from '@/components/reports/WeeklyReport';
import { MonthlyReport } from '@/components/reports/MonthlyReport';
import { Button } from '@/components/ui/Button';

export function ReportsClient() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onStoreChange={setSelectedStoreId} currentPage="reports" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('weekly')}
                variant={viewMode === 'weekly' ? 'primary' : 'secondary'}
              >
                Weekly
              </Button>
              <Button
                onClick={() => setViewMode('monthly')}
                variant={viewMode === 'monthly' ? 'primary' : 'secondary'}
              >
                Monthly
              </Button>
            </div>
          </div>
        </div>

        {viewMode === 'weekly' ? (
          <WeeklyReport selectedStoreId={selectedStoreId} />
        ) : (
          <MonthlyReport selectedStoreId={selectedStoreId} />
        )}
      </main>
    </div>
  );
}
