'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry } from '@/types/database';
import { ReportToolbar } from '@/components/reports/ReportToolbar';
import { formatDate } from '@/lib/utils/date';
import { startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, format } from 'date-fns';
import {
  exportMonthlyPerDayReportToPDF,
  exportMonthlyPerDayReportToXLS,
  MonthlyPerDayReportData
} from '@/lib/utils/export';

interface MonthlyReportPerDayProps {
  selectedStoreId: string;
}

export function MonthlyReportPerDay({ selectedStoreId }: MonthlyReportPerDayProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const supabase = createClient();

  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: currentMonth, end: monthEnd });

  const fetchData = async () => {
    if (!selectedStoreId) return;
    setLoading(true);

    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', selectedStoreId)
        .single();

      if (storeData) {
        setStoreName(storeData.name);
      }

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*, store:stores(*)')
        .eq('store_id', selectedStoreId)
        .order('last_name', { ascending: true });

      if (employeesData) {
        const filteredEmployees = employeesData.filter(emp => {
          const wasHiredByMonthEnd = emp.hiring_date <= formatDate(monthEnd);
          const stillEmployedDuringMonth = !emp.firing_date || emp.firing_date >= formatDate(currentMonth);
          return wasHiredByMonthEnd && stillEmployedDuringMonth;
        });
        setEmployees(filteredEmployees);
      }

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

  useEffect(() => {
    if (selectedStoreId) {
      // fetchData is async; its setState calls run after an await, not synchronously in the effect body
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentMonth]);

  const getEmployeeHoursForDay = (employeeId: string, date: Date) => {
    const entry = entries.find(e => e.employee_id === employeeId && e.date === formatDate(date));
    return entry?.hours || 0;
  };

  const getEmployeeMonthTotal = (employeeId: string) => {
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

  const getMonthTotal = () => {
    return entries.reduce((sum, e) => sum + e.hours, 0);
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

  const handleExportPDF = async () => {
    const reportData: MonthlyPerDayReportData = {
      storeName,
      monthYear: format(currentMonth, 'MMMM yyyy'),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        dailyHours: monthDays.map(day => getEmployeeHoursForDay(emp.id, day)),
        total: getEmployeeMonthTotal(emp.id)
      })),
      dayNames: monthDays.map(day =>
        `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      ),
      dailyTotals: monthDays.map(day => getDayTotal(day)),
      grandTotal: getMonthTotal()
    };
    await exportMonthlyPerDayReportToPDF(reportData);
  };

  const handleExportXLS = async () => {
    const reportData: MonthlyPerDayReportData = {
      storeName,
      monthYear: format(currentMonth, 'MMMM yyyy'),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        dailyHours: monthDays.map(day => getEmployeeHoursForDay(emp.id, day)),
        total: getEmployeeMonthTotal(emp.id)
      })),
      dayNames: monthDays.map(day =>
        `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      ),
      dailyTotals: monthDays.map(day => getDayTotal(day)),
      grandTotal: getMonthTotal()
    };
    await exportMonthlyPerDayReportToXLS(reportData);
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
        label={format(currentMonth, 'MMMM yyyy')}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onCurrent={goToCurrentMonth}
        previousLabel="Previous Month"
        nextLabel="Next Month"
        currentLabel="Current Month"
        onExportPDF={handleExportPDF}
        onExportXLS={handleExportXLS}
        exportDisabled={loading || employees.length === 0}
      />

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No employees found for this month.</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {employees.map((employee) => {
              const isOpen = expandedEmployeeId === employee.id;
              const workedDays = monthDays.filter((day) => getEmployeeHoursForDay(employee.id, day) > 0);
              return (
                <div key={employee.id} className="bg-white rounded-lg shadow">
                  <button
                    type="button"
                    onClick={() => setExpandedEmployeeId(isOpen ? null : employee.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left min-h-[44px]"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900 truncate">{employee.last_name} {employee.first_name}</span>
                      <span className="block text-sm text-gray-500">{workedDays.length} {workedDays.length === 1 ? 'day' : 'days'}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">{getEmployeeMonthTotal(employee.id).toFixed(2)} h</span>
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      {workedDays.length === 0 ? (
                        <p className="pt-3 text-sm text-gray-400">No hours recorded this month.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {workedDays.map((day) => (
                            <li key={day.toISOString()} className="flex items-center justify-between py-2 text-sm">
                              <span className="text-gray-700">{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              <span className="font-semibold text-gray-900">{getEmployeeHoursForDay(employee.id, day).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-gray-50 rounded-lg p-4 flex items-baseline justify-between gap-3">
              <p className="font-semibold text-gray-900">Month Total</p>
              <p className="text-sm font-bold text-gray-900">{getMonthTotal().toFixed(2)} h</p>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-max divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Employee
                  </th>
                  {monthDays.map(day => (
                    <th
                      key={day.toISOString()}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
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
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      {employee.last_name} {employee.first_name}
                    </td>
                    {monthDays.map(day => {
                      const hours = getEmployeeHoursForDay(employee.id, day);
                      return (
                        <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                          {hours > 0 ? hours.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                      {getEmployeeMonthTotal(employee.id).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Daily Total
                  </td>
                  {monthDays.map(day => (
                    <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                      {getDayTotal(day).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm text-gray-900 bg-blue-100">
                    {getMonthTotal().toFixed(2)}
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
