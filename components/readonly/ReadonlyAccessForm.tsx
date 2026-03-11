'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface StoreOption {
  id: string;
  name: string;
}

interface ReadonlyAccessFormProps {
  fixedStoreId?: string;
  fixedStoreName?: string;
}

export function ReadonlyAccessForm({ fixedStoreId, fixedStoreName }: ReadonlyAccessFormProps) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(fixedStoreId || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fixedStoreId) {
      setSelectedStoreId(fixedStoreId);
      return;
    }

    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedStoreId]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/readonly-auth/stores', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to load stores');
        return;
      }

      setStores(data.stores || []);
      if (data.stores?.length > 0) {
        setSelectedStoreId(data.stores[0].id);
      }
    } catch {
      setError('Unable to load stores');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/readonly-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: selectedStoreId, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data?.error || 'Invalid password');
        return;
      }

      window.location.reload();
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Readonly Timesheets</h1>
      <p className="text-gray-600 mb-6">
        {fixedStoreName
          ? `Enter the password for ${fixedStoreName}.`
          : 'Select a store and enter its password to view daily and weekly timesheets.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!fixedStoreId && (
          <div>
            <label htmlFor="readonly-store" className="block text-sm font-medium text-gray-700 mb-1">
              Store
            </label>
            <Select
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              options={stores.map((store) => ({ value: store.id, label: store.name }))}
              placeholder="Select a store"
              required
              disabled={loading}
            />
          </div>
        )}

        <div>
          <label htmlFor="readonly-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            type="password"
            name="readonly-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading || !password || !selectedStoreId} className="w-full">
          {loading ? 'Checking...' : 'Access Timesheets'}
        </Button>
      </form>
    </div>
  );
}
