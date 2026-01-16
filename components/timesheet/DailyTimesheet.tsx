'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry, Store, DailyComment, User } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDisplayDate, getNextDay, getPreviousDay } from '@/lib/utils/date';
import { calculateHours, generateTimeOptions } from '@/lib/utils/time';
import { logAuditClient } from '@/lib/utils/audit-client';

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
  const [dailyComment, setDailyComment] = useState('');
  const [dailyEarnings, setDailyEarnings] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const supabase = createClient();
  const timeOptions = generateTimeOptions();

  useEffect(() => {
      fetchDailyComment();
      fetchAdminUsers();
    if (selectedStoreId) {
      fetchEmployees();
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentDate]);

  const fetchEmployees = async () => {
    if (!selectedStoreId) return;

    // Fetch all employees for the store
    const { data, error } = await supabase
      .from('employees')
      .select('*, store:stores(*)')
      .eq('store_id', selectedStoreId)
      .order('last_name', { ascending: true });

    if (!error && data) {
      // Filter employees based on hiring_date and firing_date
      const filteredEmployees = data.filter(emp => {
        // Employee should appear if:
        // - hiring_date <= currentDate (employee was hired by this date)
        // - AND (firing_date is NULL OR firing_date > currentDate) (still employed on this date)
        const wasHiredByThisDate = emp.hiring_date <= currentDate;
        const stillEmployedOnThisDate = !emp.firing_date || emp.firing_date > currentDate;
        
        return wasHiredByThisDate && stillEmployedOnThisDate;
      });
      
      setEmployees(filteredEmployees);
    }
  };

  const fetchAdminUsers = async () => {
    // Fetch all users with access to the current store
    if (!selectedStoreId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_store_users', { p_store_id: selectedStoreId });

      if (error) {
        console.error('Error fetching users:', error.message, error);
        return;
      }

      if (data) {
        console.log('Raw user data from RPC:', data);
        const mappedUsers = data.map((u: any) => ({ 
          id: u.user_id, 
          email: u.user_email,
          display_name: u.display_name
        }));
        console.log('Mapped users:', mappedUsers);
        setAdminUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Exception fetching users:', err);
    }
  };

  const fetchEntries = async () => {
    if (!selectedStoreId) return;

    // First get employees for the selected store
    const { data: storeEmployees } = await supabase
      .from('employees')
      .select('id')
      .eq('store_id', selectedStoreId);

    if (!storeEmployees || storeEmployees.length === 0) {
      setEntries([]);
      return;
    }

    const employeeIds = storeEmployees.map(emp => emp.id);

    // Then get entries only for those employees
    const { data, error } = await supabase
      .from('timesheet_entries')
      .select('*, employee:employees(*, store:stores(*))')
      .eq('date', currentDate)
      .in('employee_id', employeeIds)
      .order('clock_in');

    if (!error && data) {
      setEntries(data);
    }
  };

  const fetchDailyComment = async () => {
    if (!selectedStoreId) return;

    const { data, error } = await supabase
      .from('daily_comments')
      .select('*')
      .eq('store_id', selectedStoreId)
      .eq('date', currentDate)
      .single();

    if (!error && data) {
      setDailyComment(data.comment || '');
      setDailyEarnings(data.earnings?.toString() || '');
      setResponsibleUserId(data.responsible_user_id || '');
      setCommentId(data.id);
    } else {
      setDailyComment('');
      setDailyEarnings('');
      setResponsibleUserId('');
      setCommentId(null);
    }
  };

  const saveDailyComment = async () => {
    if (!selectedStoreId) return;

    setIsSavingComment(true);
    try {
      if (commentId) {
        // Update existing comment
        const { error } = await supabase
          .from('daily_comments')
          .update({
            comment: dailyComment || null,
            earnings: dailyEarnings ? parseFloat(dailyEarnings) : null,
            responsible_user_id: responsibleUserId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId);

        if (error) {
          console.error('Error updating comment:', error);
        }
      } else {
        // Insert new comment
        const { data, error } = await supabase
          .from('daily_comments')
          .insert([{
            store_id: selectedStoreId,
            date: currentDate,
            comment: dailyComment || null,
            earnings: dailyEarnings ? parseFloat(dailyEarnings) : null,
            responsible_user_id: responsibleUserId || null,
          }])
          .select()
          .single();

        if (!error && data) {
          setCommentId(data.id);
          // Log audit for daily comment creation
          await logAuditClient(supabase, {
            action: 'CREATE',
            entityType: 'daily_comment',
            entityId: data.id,
            storeId: selectedStoreId,
            metadata: { date: currentDate },
          });
        } else if (error) {
          console.error('Error inserting comment:', error);
        }
      }
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const hours = calculateHours(clockIn, clockOut);

    try {
      if (editingEntry) {
        const oldValues = {
          clock_in: editingEntry.clock_in,
          clock_out: editingEntry.clock_out,
          hours: editingEntry.hours,
        };
        const newValues = { clock_in: clockIn, clock_out: clockOut, hours };

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
          // Log audit for timesheet entry update
          const employee = employees.find(e => e.id === editingEntry.employee_id);
          await logAuditClient(supabase, {
            action: 'UPDATE',
            entityType: 'timesheet_entry',
            entityId: editingEntry.id,
            entityName: employee ? `${employee.first_name} ${employee.last_name}` : undefined,
            storeId: selectedStoreId,
            changes: { before: oldValues, after: newValues },
            metadata: { date: currentDate },
          });
          await fetchEntries();
          closeModal();
        }
      } else {
        const { data, error } = await supabase
          .from('timesheet_entries')
          .insert([{
            employee_id: selectedEmployeeId,
            date: currentDate,
            clock_in: clockIn,
            clock_out: clockOut,
            hours,
          }])
          .select();

        if (!error && data) {
          // Log audit for timesheet entry creation
          const employee = employees.find(e => e.id === selectedEmployeeId);
          await logAuditClient(supabase, {
            action: 'CREATE',
            entityType: 'timesheet_entry',
            entityId: data[0].id,
            entityName: employee ? `${employee.first_name} ${employee.last_name}` : undefined,
            storeId: selectedStoreId,
            metadata: { date: currentDate, clock_in: clockIn, clock_out: clockOut, hours },
          });
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
      const entry = entries.find(e => e.id === id);
      const { error } = await supabase.from('timesheet_entries').delete().eq('id', id);
      
      if (!error && entry) {
        // Log audit for timesheet entry deletion
        const employee = employees.find(e => e.id === entry.employee_id);
        await logAuditClient(supabase, {
          action: 'DELETE',
          entityType: 'timesheet_entry',
          entityId: id,
          entityName: employee ? `${employee.first_name} ${employee.last_name}` : undefined,
          storeId: selectedStoreId,
          metadata: { date: entry.date, clock_in: entry.clock_in, clock_out: entry.clock_out },
        });
      }
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

  const openModalForEmployee = (employeeId: string) => {
    setEditingEntry(null);
    setSelectedEmployeeId(employeeId);
    setClockIn('09:00');
    setClockOut('17:00');
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
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
          <div className="text-center flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-gray-900">
              {formatDisplayDate(currentDate)}
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={currentDate}
                onChange={handleDateChange}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
              <Button onClick={goToToday} variant="secondary" className="text-sm">
                Today
              </Button>
            </div>
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
            {employees.map((employee) => {
              const entry = entries.find(e => e.employee_id === employee.id);
              return (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.last_name} {employee.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.store?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry?.clock_in || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry?.clock_out || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {entry ? entry.hours.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      {entry ? (
                        <>
                          <Button onClick={() => openModal(entry)} variant="secondary">
                            Edit
                          </Button>
                          <Button onClick={() => handleDelete(entry.id)} variant="danger">
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => openModalForEmployee(employee.id)} variant="secondary">
                          Add Entry
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!selectedStoreId && (
        <p className="text-center text-gray-500 py-8">Please select a store to view timesheet entries.</p>
      )}

      {selectedStoreId && employees.length === 0 && (
        <p className="text-center text-gray-500 py-8">No employees found for this store on this date.</p>
      )}

      {selectedStoreId && employees.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <p className="text-lg font-semibold text-gray-900">
            Total Hours: {entries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(2)}
          </p>
          
          <div>
            <label htmlFor="daily-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Daily Comment
            </label>
            <textarea
              id="daily-comment"
              value={dailyComment}
              onChange={(e) => setDailyComment(e.target.value)}
              onBlur={saveDailyComment}
              placeholder="Add any notes or comments for this day..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-h-[80px] resize-y"
              disabled={isSavingComment}
            />
          </div>
          
          <div>
            <label htmlFor="daily-earnings" className="block text-sm font-medium text-gray-700 mb-2">
              Daily Earnings (€)
            </label>
            <input
              id="daily-earnings"
              type="number"
              step="0.01"
              min="0"
              value={dailyEarnings}
              onChange={(e) => setDailyEarnings(e.target.value)}
              onBlur={saveDailyComment}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              disabled={isSavingComment}
            />
          </div>
          
          <div>
            <label htmlFor="responsible-user" className="block text-sm font-medium text-gray-700 mb-2">
              Responsible for Earnings
            </label>
            <Select
              value={responsibleUserId}
              onChange={(e) => {
                setResponsibleUserId(e.target.value);
                saveDailyComment();
              }}
              options={[
                { value: '', label: 'Select a user' },
                ...adminUsers.map((user) => ({
                  value: user.id,
                  label: user.display_name || user.email,
                })),
              ]}
              disabled={isSavingComment}
            />
          </div>
          
          {isSavingComment && (
            <p className="text-xs text-gray-500 mt-1">Saving...</p>
          )}
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
