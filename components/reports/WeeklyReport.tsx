'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDisplayDate } from '@/lib/utils/date';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';

interface WeeklyReportProps {
  selectedStoreId: string;
}

export function WeeklyReport({ selectedStoreId }: WeeklyReportProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  useEffect(() => {
    if (selectedStoreId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentWeekStart]);

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
        // Filter employees based on week dates
        const filteredEmployees = employeesData.filter(emp => {
          const wasHiredByWeekEnd = emp.hiring_date <= formatDate(weekEnd);
          const stillEmployedDuringWeek = !emp.firing_date || emp.firing_date >= formatDate(currentWeekStart);
          return wasHiredByWeekEnd && stillEmployedDuringWeek;
        });
        setEmployees(filteredEmployees);
      }

      // Fetch entries for the week
      const { data: entriesData } = await supabase
        .from('timesheet_entries')
        .select('*, employee:employees!inner(*, store:stores(*))')
        .eq('employee.store_id', selectedStoreId)
        .gte('date', formatDate(currentWeekStart))
        .lte('date', formatDate(weekEnd));

      if (entriesData) {
        setEntries(entriesData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeHoursForDay = (employeeId: string, date: Date) => {
    const entry = entries.find(
      e => e.employee_id === employeeId && e.date === formatDate(date)
    );
    return entry?.hours || 0;
  };

  const getEmployeeWeekTotal = (employeeId: string) => {
    return entries
      .filter(e => e.employee_id === employeeId)
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const getDayTotal = (date: Date) => {
    const dateStr = formatDate(date);
    return entries
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const getWeekTotal = () => {
    return entries.reduce((sum, e) => sum + e.hours, 0);
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
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
        <Button onClick={goToPreviousWeek} variant="secondary">
          ← Previous Week
        </Button>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {formatDisplayDate(formatDate(currentWeekStart))} - {formatDisplayDate(formatDate(weekEnd))}
          </p>
          <Button onClick={goToCurrentWeek} variant="secondary" className="mt-2 text-sm">
            Current Week
          </Button>
        </div>
        <Button onClick={goToNextWeek} variant="secondary">
          Next Week →
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No employees found for this week.</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      <br />
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      {employee.first_name} {employee.last_name}
                    </td>
                    {weekDays.map((day) => {
                      const hours = getEmployeeHoursForDay(employee.id, day);
                      return (
                        <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                          {hours > 0 ? hours.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                      {getEmployeeWeekTotal(employee.id).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-gray-50">
                    Daily Total
                  </td>
                  {weekDays.map((day) => (
                    <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                      {getDayTotal(day).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm text-gray-900 bg-blue-100">
                    {getWeekTotal().toFixed(2)}
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
