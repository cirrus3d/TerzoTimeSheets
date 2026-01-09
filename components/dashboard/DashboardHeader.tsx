'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Select } from '@/components/ui/Select';
import { Store } from '@/types/database';
import Link from 'next/link';

interface DashboardHeaderProps {
  onStoreChange: (storeId: string) => void;
}

export function DashboardHeader({ onStoreChange }: DashboardHeaderProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');

    if (!error && data) {
      setStores(data);
      // Auto-select the first store if available
      if (data.length > 0) {
        setSelectedStoreId(data[0].id);
        onStoreChange(data[0].id);
      }
    }
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    onStoreChange(storeId);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">TerzoTimeSheets</h1>
          <div className="flex-1 max-w-xs">
            <Select
              value={selectedStoreId}
              onChange={(e) => handleStoreChange(e.target.value)}
              options={stores.map((store) => ({
                value: store.id,
                label: store.name,
              }))}
              placeholder="Select a store"
              required
            />
          </div>
          <div className="flex gap-4">
            <Link
              href="/management"
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-gray-200 text-gray-900 hover:bg-gray-300"
            >
              Manage
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
