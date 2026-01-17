'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

interface UserEarnings {
  userId: string;
  displayName: string;
  email: string;
  totalEarnings: number;
}

interface EarningsData {
  earnings: number;
  responsible_user_id: string | null;
}

export function EarningsClient() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [userEarnings, setUserEarnings] = useState<UserEarnings[]>([]);
  const [unassignedEarnings, setUnassignedEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    if (selectedStoreId) {
      fetchEarnings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  const fetchEarnings = async () => {
    if (!selectedStoreId) return;
    setLoading(true);

    try {
      // Fetch store name
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', selectedStoreId)
        .single();

      if (storeData) {
        setStoreName(storeData.name);
      }

      // Fetch all daily comments with earnings for this store
      const { data: earningsData, error: earningsError } = await supabase
        .from('daily_comments')
        .select('earnings, responsible_user_id')
        .eq('store_id', selectedStoreId)
        .not('earnings', 'is', null);

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
        return;
      }

      // Get unique user IDs that have earnings
      const userIds = [...new Set(
        (earningsData || [])
          .filter((e: EarningsData) => e.responsible_user_id)
          .map((e: EarningsData) => e.responsible_user_id as string)
      )];

      // Fetch user profiles for display names
      let userProfiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach((profile) => {
            userProfiles[profile.id] = profile.display_name;
          });
        }
      }

      // Calculate earnings per user
      const earningsByUser: Record<string, number> = {};
      let unassigned = 0;

      (earningsData || []).forEach((entry: EarningsData) => {
        const amount = entry.earnings || 0;
        if (entry.responsible_user_id) {
          earningsByUser[entry.responsible_user_id] = 
            (earningsByUser[entry.responsible_user_id] || 0) + amount;
        } else {
          unassigned += amount;
        }
      });

      // Build the user earnings array
      const userEarningsList: UserEarnings[] = Object.entries(earningsByUser).map(
        ([userId, total]) => ({
          userId,
          displayName: userProfiles[userId] || 'Unknown User',
          email: '',
          totalEarnings: total,
        })
      );

      // Sort by total earnings descending
      userEarningsList.sort((a, b) => b.totalEarnings - a.totalEarnings);

      setUserEarnings(userEarningsList);
      setUnassignedEarnings(unassigned);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const grandTotal = userEarnings.reduce((sum, u) => sum + u.totalEarnings, 0) + unassignedEarnings;

  if (!selectedStoreId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onStoreChange={setSelectedStoreId} currentPage="earnings" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 py-8">
            Please select a store to view earnings.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onStoreChange={setSelectedStoreId} currentPage="earnings" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            All-Time Earnings - {storeName}
          </h2>
          <p className="text-gray-600 mt-1">
            Total earnings recorded per responsible user
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : userEarnings.length === 0 && unassignedEarnings === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No earnings recorded for this store yet.
          </p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsible User
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userEarnings.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(user.totalEarnings)}
                    </td>
                  </tr>
                ))}
                {unassignedEarnings > 0 && (
                  <tr className="bg-yellow-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-800">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Unassigned (No user selected)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-800 text-right font-semibold">
                      {formatCurrency(unassignedEarnings)}
                    </td>
                  </tr>
                )}
                <tr className="bg-blue-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                    Grand Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 text-right">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
