'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Select } from '@/components/ui/Select';
import { Store } from '@/types/database';
import Link from 'next/link';

interface DashboardHeaderProps {
  onStoreChange: (storeId: string) => void;
  currentPage?: 'dashboard' | 'reports' | 'management' | 'audit' | 'earnings';
}

export function DashboardHeader({ onStoreChange, currentPage = 'dashboard' }: DashboardHeaderProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const supabase = createClient();

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

  useEffect(() => {
    // fetchStores is async; its setState calls happen after the network
    // request resolves, not synchronously within this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    onStoreChange(storeId);
  };

  const navItems: { href: string; label: string; key: 'dashboard' | 'reports' | 'earnings' | 'management' | 'audit' }[] = [
    { href: '/dashboard', label: 'Timesheets', key: 'dashboard' },
    { href: '/reports', label: 'Reports', key: 'reports' },
    { href: '/earnings', label: 'Earnings', key: 'earnings' },
    { href: '/management', label: 'Manage', key: 'management' },
    { href: '/audit', label: 'Audit Log', key: 'audit' },
  ];

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">TerzoTimeSheets</h1>
            <div className="sm:hidden">
              <LogoutButton />
            </div>
          </div>
          <div className="w-full sm:flex-1 sm:max-w-xs">
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
          <nav className="scrollbar-hide flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-end">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap shrink-0 px-3 py-2 text-sm sm:px-4 sm:text-base rounded-lg font-medium transition-colors duration-200 ${
                  currentPage === item.key
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="hidden sm:block">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
