'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry } from '@/types/database';
import { ReportToolbar } from '@/components/reports/ReportToolbar';
import { formatDate, formatDisplayDate } from '@/lib/utils/date';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { exportWeeklyReportToPDF, exportWeeklyReportToXLS, WeeklyReportData } from '@/lib/utils/export';

interface WeeklyReportProps {
  selectedStoreId: string;
}

export function WeeklyReport({ selectedStoreId }: WeeklyReportProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const supabase = createClient();

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const fetchData = async () => {
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

  useEffect(() => {
    if (selectedStoreId) {
      // fetchData is async; its setState calls run after an await, not synchronously in the effect body
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentWeekStart]);

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

  const handleExportPDF = async () => {
    const reportData: WeeklyReportData = {
      storeName,
      weekStart: formatDisplayDate(formatDate(currentWeekStart)),
      weekEnd: formatDisplayDate(formatDate(weekEnd)),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        dailyHours: weekDays.map(day => getEmployeeHoursForDay(emp.id, day)),
        total: getEmployeeWeekTotal(emp.id)
      })),
      dayNames: weekDays.map(day => 
        `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      ),
      dailyTotals: weekDays.map(day => getDayTotal(day)),
      grandTotal: getWeekTotal()
    };
    await exportWeeklyReportToPDF(reportData);
  };

  const handleExportXLS = async () => {
    const reportData: WeeklyReportData = {
      storeName,
      weekStart: formatDisplayDate(formatDate(currentWeekStart)),
      weekEnd: formatDisplayDate(formatDate(weekEnd)),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        dailyHours: weekDays.map(day => getEmployeeHoursForDay(emp.id, day)),
        total: getEmployeeWeekTotal(emp.id)
      })),
      dayNames: weekDays.map(day => 
        `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      ),
      dailyTotals: weekDays.map(day => getDayTotal(day)),
      grandTotal: getWeekTotal()
    };
    await exportWeeklyReportToXLS(reportData);
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
      <ReportToolbar
        label={`${formatDisplayDate(formatDate(currentWeekStart))} - ${formatDisplayDate(formatDate(weekEnd))}`}
        onPrevious={goToPreviousWeek}
        onNext={goToNextWeek}
        onCurrent={goToCurrentWeek}
        previousLabel="Previous Week"
        nextLabel="Next Week"
        currentLabel="Current Week"
        onExportPDF={handleExportPDF}
        onExportXLS={handleExportXLS}
        exportDisabled={loading || employees.length === 0}
      />

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No employees found for this week.</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {employees.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-gray-900 truncate">{employee.last_name} {employee.first_name}</p>
                  <p className="shrink-0 text-sm font-semibold text-gray-900">{getEmployeeWeekTotal(employee.id).toFixed(2)} h</p>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const hours = getEmployeeHoursForDay(employee.id, day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`rounded-md py-1.5 text-center ${hours > 0 ? 'bg-blue-50 text-gray-900' : 'bg-gray-50 text-gray-400'}`}
                      >
                        <div className="text-[10px] uppercase tracking-wide">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-xs font-semibold">{hours > 0 ? hours.toFixed(1) : '–'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-gray-900">Daily Total</p>
                <p className="shrink-0 text-sm font-bold text-gray-900">{getWeekTotal().toFixed(2)} h</p>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="rounded-md py-1.5 text-center bg-white">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-xs font-semibold text-gray-900">{getDayTotal(day).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200">
                      {employee.last_name} {employee.first_name}
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
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-gray-50 border-r border-gray-200">
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
