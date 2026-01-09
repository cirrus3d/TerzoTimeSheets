'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry, Store } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDisplayDate, getNextDay, getPreviousDay } from '@/lib/utils/date';
import { calculateHours, generateTimeOptions } from '@/lib/utils/time';

interface DailyTimesheetProps {
  selectedStoreId: string;
}

export function DailyTimesheet({ selectedStoreId }: DailyTimesheetProps) {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (selectedStoreId) {
      fetchEmployees();
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchEmployees = async () => {
    if (!selectedStoreId) return;

    const { data, error } = await supabase
      .from('employees')
      .select('*, store:stores(*)')
      .eq('store_id', selectedStoreId)
      .order('last_name');

    if (!error && data) {
      setEmployees(data);
    }
  };

  const fetchEntries = async () => {
    if (!selectedStoreId) return;

    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*, employee:employees!inner(*, store:stores(*))')
      .eq('employee.store_id', selectedStoreId)
      .eq('date', currentDate)
      .order('clock_in');

    if (!error && data) {
      setEntries(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const hours = calculateHours(clockIn, clockOut);

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('timesheet_entries')
          .update({
            clock_in: clockIn,
            clock_out: clockOut,
            hours,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEntry.id);

        if (!error) {
          await fetchEntries();
          closeModal();
        }
      } else {
        const { error } = await supabase
          .from('timesheet_entries')
          .insert([{
            employee_id: selectedEmployeeId,
            date: currentDate,
            clock_in: clockIn,
            clock_out: clockOut,
            hours,
          }]);

        if (!error) {
          await fetchEntries();
          closeModal();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await supabase.from('timesheet_entries').delete().eq('id', id);
      await fetchEntries();
    }
  };

  const openModal = (entry?: TimesheetEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setSelectedEmployeeId(entry.employee_id);
      setClockIn(entry.clock_in);
      setClockOut(entry.clock_out);
    } else {
      setEditingEntry(null);
      setSelectedEmployeeId('');
      setClockIn('09:00');
      setClockOut('17:00');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setSelectedEmployeeId('');
    setClockIn('09:00');
    setClockOut('17:00');
  };

  const goToPreviousDay = () => {
    setCurrentDate(getPreviousDay(currentDate));
  };

  const goToNextDay = () => {
    setCurrentDate(getNextDay(currentDate));
  };

  const goToToday = () => {
    setCurrentDate(formatDate(new Date()));
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Daily Timesheet</h2>
          <Button onClick={() => openModal()} disabled={!selectedStoreId}>Add Entry</Button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <Button onClick={goToPreviousDay} variant="secondary">
            ← Previous
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {formatDisplayDate(currentDate)}
            </p>
            <Button onClick={goToToday} variant="secondary" className="mt-2 text-sm">
              Today
            </Button>
          </div>
          <Button onClick={goToNextDay} variant="secondary">
            Next →
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clock Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.employee?.first_name} {entry.employee?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.employee?.store?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.clock_in}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.clock_out}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {entry.hours.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => openModal(entry)} variant="secondary">
                      Edit
                    </Button>
                    <Button onClick={() => handleDelete(entry.id)} variant="danger">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!selectedStoreId && (
        <p className="text-center text-gray-500 py-8">Please select a store to view timesheet entries.</p>
      )}

      {selectedStoreId && entries.length === 0 && (
        <p className="text-center text-gray-500 py-8">No entries for this date. Add one to get started!</p>
      )}

      {selectedStoreId && entries.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">
            Total Hours: {entries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(2)}
          </p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEntry ? 'Edit Entry' : 'Add Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingEntry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <Select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.first_name} ${emp.last_name}`,
                }))}
                placeholder="Select an employee"
                required
                disabled={loading}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock In
            </label>
            <Select
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              options={timeOptions.map((time) => ({
                value: time,
                label: time,
              }))}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock Out
            </label>
            <Select
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              options={timeOptions.map((time) => ({
                value: time,
                label: time,
              }))}
              required
              disabled={loading}
            />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Hours:</span>{' '}
              {calculateHours(clockIn, clockOut).toFixed(2)}
            </p>
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
