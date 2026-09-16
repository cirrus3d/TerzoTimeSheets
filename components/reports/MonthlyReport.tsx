'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Employee, TimesheetEntry } from '@/types/database';
import { ReportToolbar } from '@/components/reports/ReportToolbar';
import { formatDate } from '@/lib/utils/date';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { exportMonthlyReportToPDF, exportMonthlyReportToXLS, MonthlyReportData } from '@/lib/utils/export';

interface MonthlyReportProps {
  selectedStoreId: string;
}

export function MonthlyReport({ selectedStoreId }: MonthlyReportProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const supabase = createClient();

  const monthEnd = endOfMonth(currentMonth);

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

  useEffect(() => {
    if (selectedStoreId) {
      // fetchData is async; its setState calls run after an await, not synchronously in the effect body
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, currentMonth]);

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

  const handleExportPDF = async () => {
    const reportData: MonthlyReportData = {
      storeName,
      monthYear: format(currentMonth, 'MMMM yyyy'),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        daysWorked: getEmployeeDaysWorked(emp.id),
        totalHours: getEmployeeMonthTotal(emp.id),
        avgHours: getEmployeeDaysWorked(emp.id) > 0 
          ? getEmployeeMonthTotal(emp.id) / getEmployeeDaysWorked(emp.id) 
          : 0
      })),
      totalDaysWorked: getTotalDaysWorked(),
      grandTotal: getMonthTotal()
    };
    await exportMonthlyReportToPDF(reportData);
  };

  const handleExportXLS = async () => {
    const reportData: MonthlyReportData = {
      storeName,
      monthYear: format(currentMonth, 'MMMM yyyy'),
      employees: employees.map(emp => ({
        name: `${emp.last_name} ${emp.first_name}`,
        daysWorked: getEmployeeDaysWorked(emp.id),
        totalHours: getEmployeeMonthTotal(emp.id),
        avgHours: getEmployeeDaysWorked(emp.id) > 0 
          ? getEmployeeMonthTotal(emp.id) / getEmployeeDaysWorked(emp.id) 
          : 0
      })),
      totalDaysWorked: getTotalDaysWorked(),
      grandTotal: getMonthTotal()
    };
    await exportMonthlyReportToXLS(reportData);
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
              const totalHours = getEmployeeMonthTotal(employee.id);
              const daysWorked = getEmployeeDaysWorked(employee.id);
              const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;
              return (
                <div key={employee.id} className="bg-white rounded-lg shadow p-4">
                  <p className="font-medium text-gray-900 truncate">{employee.last_name} {employee.first_name}</p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-gray-50 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-gray-500">Days</dt>
                      <dd className="text-sm font-semibold text-gray-900">{daysWorked}</dd>
                    </div>
                    <div className="rounded-md bg-blue-50 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-gray-500">Total h</dt>
                      <dd className="text-sm font-semibold text-gray-900">{totalHours.toFixed(2)}</dd>
                    </div>
                    <div className="rounded-md bg-gray-50 py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-gray-500">Avg h/day</dt>
                      <dd className="text-sm font-semibold text-gray-900">{avgHours.toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">Total</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-gray-500">Days</dt>
                  <dd className="text-sm font-bold text-gray-900">{getTotalDaysWorked()}</dd>
                </div>
                <div className="rounded-md bg-blue-100 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-gray-500">Total h</dt>
                  <dd className="text-sm font-bold text-gray-900">{getMonthTotal().toFixed(2)}</dd>
                </div>
                <div className="rounded-md bg-white py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-gray-500">Avg h/day</dt>
                  <dd className="text-sm font-bold text-gray-900">-</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Worked
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Total Hours
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.last_name} {employee.first_name}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {daysWorked}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                        {totalHours.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {avgHours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-4 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    {getTotalDaysWorked()}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 bg-blue-100">
                    {getMonthTotal().toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
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
