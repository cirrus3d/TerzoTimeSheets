'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/date';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';

interface MonthlyReportProps {
  selectedStoreId: string;
}

export function MonthlyReport({ selectedStoreId }: MonthlyReportProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    if (selectedStoreId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentMonth]);

  const fetchData = async () => {
    if (!selectedStoreId) return;
    setLoading(true);

    try {
      // Fetch employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*, store:stores(*)')
        .eq('store_id', selectedStoreId)
        .order('last_name', { ascending: true });

      if (employeesData) {
        // Filter employees based on month dates
        const filteredEmployees = employeesData.filter(emp => {
          const wasHiredByMonthEnd = emp.hiring_date <= formatDate(monthEnd);
          const stillEmployedDuringMonth = !emp.firing_date || emp.firing_date >= formatDate(currentMonth);
          return wasHiredByMonthEnd && stillEmployedDuringMonth;
        });
        setEmployees(filteredEmployees);
      }

      // Fetch entries for the month
      const { data: entriesData } = await supabase
        .from('timesheet_entries')
        .select('*, employee:employees!inner(*, store:stores(*))')
        .eq('employee.store_id', selectedStoreId)
        .gte('date', formatDate(currentMonth))
        .lte('date', formatDate(monthEnd));

      if (entriesData) {
        setEntries(entriesData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeMonthTotal = (employeeId: string) => {
    return entries
      .filter(e => e.employee_id === employeeId)
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const getEmployeeDaysWorked = (employeeId: string) => {
    return new Set(
      entries
        .filter(e => e.employee_id === employeeId && e.hours > 0)
        .map(e => e.date)
    ).size;
  };

  const getMonthTotal = () => {
    return entries.reduce((sum, e) => sum + e.hours, 0);
  };

  const getTotalDaysWorked = () => {
    return new Set(entries.filter(e => e.hours > 0).map(e => e.date)).size;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  if (!selectedStoreId) {
    return (
      <p className="text-center text-gray-500 py-8">
        Please select a store to view reports.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button onClick={goToPreviousMonth} variant="secondary">
          ← Previous Month
        </Button>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </p>
          <Button onClick={goToCurrentMonth} variant="secondary" className="mt-2 text-sm">
            Current Month
          </Button>
        </div>
        <Button onClick={goToNextMonth} variant="secondary">
          Next Month →
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No employees found for this month.</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Worked
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Hours/Day
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const totalHours = getEmployeeMonthTotal(employee.id);
                  const daysWorked = getEmployeeDaysWorked(employee.id);
                  const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;

                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {daysWorked}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                        {totalHours.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {avgHours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {getTotalDaysWorked()}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900 bg-blue-100">
                    {getMonthTotal().toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
