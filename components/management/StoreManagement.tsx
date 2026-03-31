'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Store } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { logAuditClient } from '@/lib/utils/audit-client';
import { createStore } from '@/app/actions';

export function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');

    if (!error && data) {
      setStores(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStore) {
        const oldValues = { name: editingStore.name };
        const newValues = { name: storeName };

        const { error } = await supabase
          .from('stores')
          .update({ name: storeName, updated_at: new Date().toISOString() })
          .eq('id', editingStore.id);

        if (!error) {
          // Log audit for store update
          await logAuditClient(supabase, {
            action: 'UPDATE',
            entityType: 'store',
            entityId: editingStore.id,
            entityName: storeName,
            storeId: editingStore.id,
            changes: { before: oldValues, after: newValues },
          });
          await fetchStores();
          closeModal();
        }
      } else {
        const { data: newStore, error: storeError } = await createStore(storeName);

        if (storeError || !newStore) {
          alert('Error creating store: ' + (storeError ?? 'Unknown error'));
          return;
        }

        // Log audit for store creation
        await logAuditClient(supabase, {
          action: 'CREATE',
          entityType: 'store',
          entityId: newStore.id,
          entityName: storeName,
          storeId: newStore.id,
        });

        await fetchStores();
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will delete all employees in this store.')) {
      const store = stores.find(s => s.id === id);
      const { error } = await supabase.from('stores').delete().eq('id', id);
      
      if (!error && store) {
        // Log audit for store deletion
        await logAuditClient(supabase, {
          action: 'DELETE',
          entityType: 'store',
          entityId: id,
          entityName: store.name,
          storeId: id,
        });
      }
      await fetchStores();
    }
  };

  const openModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setStoreName(store.name);
    } else {
      setEditingStore(null);
      setStoreName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStore(null);
    setStoreName('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Stores</h2>
        <Button onClick={() => openModal()}>Add Store</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div key={store.id} className="p-4 bg-white rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{store.name}</h3>
            <div className="flex gap-2">
              <Button onClick={() => openModal(store)} variant="secondary" className="flex-1">
                Edit
              </Button>
              <Button onClick={() => handleDelete(store.id)} variant="danger" className="flex-1">
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <p className="text-center text-gray-500 py-8">No stores yet. Add one to get started!</p>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStore ? 'Edit Store' : 'Add Store'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={closeModal} variant="secondary" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
