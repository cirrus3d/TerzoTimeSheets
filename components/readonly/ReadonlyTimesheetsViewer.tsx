'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  addDays,
  endOfMonth,
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subDays,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface StoreOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  hiring_date: string;
  firing_date: string | null;
}

interface Entry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours: number;
}

interface DailyResponse {
  date: string;
  employees: EmployeeOption[];
  entries: Entry[];
}

interface WeeklyResponse {
  weekStart: string;
  weekEnd: string;
  employees: EmployeeOption[];
  entries: Entry[];
}

interface MonthlyResponse {
  monthStart: string;
  monthEnd: string;
  employees: EmployeeOption[];
  entries: Entry[];
}

interface OptionsResponse {
  store: StoreOption;
  employees: EmployeeOption[];
}

interface ReadonlyTimesheetsViewerProps {
  storeId: string;
}

export function ReadonlyTimesheetsViewer({ storeId }: ReadonlyTimesheetsViewerProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [storeName, setStoreName] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weekStart, setWeekStart] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [monthStart, setMonthStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));

  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const employeeOptions = useMemo(
    () => [
      { value: '', label: 'All Employees' },
      ...employees.map((employee) => ({
        value: employee.id,
        label: `${employee.last_name} ${employee.first_name}`,
      })),
    ],
    [employees]
  );

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDaily();
    } else if (viewMode === 'weekly') {
      fetchWeekly();
    } else {
      fetchMonthly();
    }
  }, [selectedEmployeeId, date, weekStart, monthStart, viewMode]);

  const fetchOptions = async () => {
    try {
      const query = new URLSearchParams({ mode: 'options' });
      const response = await fetch(`/api/readonly-timesheets?${query.toString()}`, {
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      const data = (await response.json()) as OptionsResponse | { error?: string };

      if (!response.ok) {
        setError((data as { error?: string })?.error || 'Unable to load filters');
        return;
      }

      setStoreName((data as OptionsResponse).store?.name || 'Unknown Store');
      setEmployees((data as OptionsResponse).employees || []);
      setSelectedEmployeeId('');
    } catch {
      setError('Unable to load filters');
    }
  };

  const fetchDaily = async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        mode: 'daily',
        date,
      });

      if (selectedEmployeeId) {
        query.set('employeeId', selectedEmployeeId);
      }

      const response = await fetch(`/api/readonly-timesheets?${query.toString()}`, {
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to load daily timesheet');
        return;
      }

      setDailyData(data as DailyResponse);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekly = async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        mode: 'weekly',
        weekStart,
      });

      if (selectedEmployeeId) {
        query.set('employeeId', selectedEmployeeId);
      }

      const response = await fetch(`/api/readonly-timesheets?${query.toString()}`, {
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to load weekly timesheet');
        return;
      }

      setWeeklyData(data as WeeklyResponse);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        mode: 'monthly',
        monthStart,
      });

      if (selectedEmployeeId) {
        query.set('employeeId', selectedEmployeeId);
      }

      const response = await fetch(`/api/readonly-timesheets?${query.toString()}`, {
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to load monthly timesheet');
        return;
      }

      setMonthlyData(data as MonthlyResponse);
    } finally {
      setLoading(false);
    }
  };

  const dailyTotalHours = useMemo(() => {
    return (dailyData?.entries || []).reduce((sum, entry) => sum + entry.hours, 0);
  }, [dailyData]);

  const weekDays = useMemo(() => {
    const start = parseISO(weekStart);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [weekStart]);

  const weeklyHoursByEmployeeAndDay = useMemo(() => {
    const map: Record<string, number> = {};

    for (const entry of weeklyData?.entries || []) {
      const key = `${entry.employee_id}_${entry.date}`;
      map[key] = (map[key] || 0) + entry.hours;
    }

    return map;
  }, [weeklyData]);

  const weeklyEmployeeTotal = (employeeId: string) => {
    return weekDays.reduce((sum, day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return sum + (weeklyHoursByEmployeeAndDay[`${employeeId}_${dayStr}`] || 0);
    }, 0);
  };

  const weeklyDayTotal = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return (weeklyData?.employees || []).reduce((sum, employee) => {
      return sum + (weeklyHoursByEmployeeAndDay[`${employee.id}_${dayStr}`] || 0);
    }, 0);
  };

  const weeklyGrandTotal = (weeklyData?.entries || []).reduce((sum, entry) => sum + entry.hours, 0);

  const monthDays = useMemo(() => {
    const start = parseISO(monthStart);
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  }, [monthStart]);

  const monthlyHoursByEmployeeAndDay = useMemo(() => {
    const map: Record<string, number> = {};

    for (const entry of monthlyData?.entries || []) {
      const key = `${entry.employee_id}_${entry.date}`;
      map[key] = (map[key] || 0) + entry.hours;
    }

    return map;
  }, [monthlyData]);

  const monthlyEmployeeTotal = (employeeId: string) => {
    return monthDays.reduce((sum, day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return sum + (monthlyHoursByEmployeeAndDay[`${employeeId}_${dayStr}`] || 0);
    }, 0);
  };

  const monthlyDayTotal = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return (monthlyData?.employees || []).reduce((sum, employee) => {
      return sum + (monthlyHoursByEmployeeAndDay[`${employee.id}_${dayStr}`] || 0);
    }, 0);
  };

  const monthlyGrandTotal = (monthlyData?.entries || []).reduce((sum, entry) => sum + entry.hours, 0);

  const onPreviousDate = () => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'));
  const onNextDate = () => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'));

  const onPreviousWeek = () =>
    setWeekStart(format(startOfWeek(subWeeks(parseISO(weekStart), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const onNextWeek = () =>
    setWeekStart(format(startOfWeek(addWeeks(parseISO(weekStart), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const onPreviousMonth = () =>
    setMonthStart(format(startOfMonth(subMonths(parseISO(monthStart), 1)), 'yyyy-MM-dd'));
  const onNextMonth = () =>
    setMonthStart(format(startOfMonth(addMonths(parseISO(monthStart), 1)), 'yyyy-MM-dd'));

  const handleLogout = async () => {
    await fetch('/api/readonly-auth/logout', { method: 'POST' });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Readonly Timesheets</h1>
              <p className="text-sm text-gray-600 mt-1">Store: {storeName || storeId}</p>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <Select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              options={employeeOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('daily')}
                variant={viewMode === 'daily' ? 'primary' : 'secondary'}
                className="flex-1"
              >
                Daily
              </Button>
              <Button
                onClick={() => setViewMode('weekly')}
                variant={viewMode === 'weekly' ? 'primary' : 'secondary'}
                className="flex-1"
              >
                Weekly
              </Button>
              <Button
                onClick={() => setViewMode('monthly')}
                variant={viewMode === 'monthly' ? 'primary' : 'secondary'}
                className="flex-1"
              >
                Monthly
              </Button>
            </div>
          </div>

          <div>
            {viewMode === 'daily' ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </>
            ) : viewMode === 'weekly' ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Start</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(event) =>
                    setWeekStart(
                      format(startOfWeek(parseISO(event.target.value), { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="month"
                  value={format(parseISO(monthStart), 'yyyy-MM')}
                  onChange={(event) =>
                    setMonthStart(format(startOfMonth(new Date(`${event.target.value}-01T00:00:00`)), 'yyyy-MM-dd'))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </>
            )}
          </div>
        </div>

        {viewMode === 'daily' && (
          <div className="flex justify-center gap-3">
            <Button onClick={onPreviousDate} variant="secondary">Previous Day</Button>
            <Button onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))} variant="secondary">Today</Button>
            <Button onClick={onNextDate} variant="secondary">Next Day</Button>
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="flex justify-center gap-3">
            <Button onClick={onPreviousWeek} variant="secondary">Previous Week</Button>
            <Button
              onClick={() => setWeekStart(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))}
              variant="secondary"
            >
              Current Week
            </Button>
            <Button onClick={onNextWeek} variant="secondary">Next Week</Button>
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="flex justify-center gap-3">
            <Button onClick={onPreviousMonth} variant="secondary">Previous Month</Button>
            <Button
              onClick={() => setMonthStart(format(startOfMonth(new Date()), 'yyyy-MM-dd'))}
              variant="secondary"
            >
              Current Month
            </Button>
            <Button onClick={onNextMonth} variant="secondary">Next Month</Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && <p className="text-center text-gray-500 py-6">Loading...</p>}

        {!loading && viewMode === 'daily' && dailyData && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyData.employees.map((employee) => {
                  const entry = dailyData.entries.find((row) => row.employee_id === employee.id);

                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.last_name} {employee.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry?.clock_in || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry?.clock_out || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {entry ? entry.hours.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Total Hours: {dailyTotalHours.toFixed(2)}</p>
            </div>
          </div>
        )}

        {!loading && viewMode === 'weekly' && weeklyData && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {format(day, 'EEE')}<br />{format(day, 'MMM d')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklyData.employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.last_name} {employee.first_name}
                    </td>
                    {weekDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const hours = weeklyHoursByEmployeeAndDay[`${employee.id}_${dayStr}`] || 0;

                      return (
                        <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                          {hours > 0 ? hours.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                      {weeklyEmployeeTotal(employee.id).toFixed(2)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">Daily Total</td>
                  {weekDays.map((day) => (
                    <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                      {weeklyDayTotal(day).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm text-gray-900 bg-blue-100">{weeklyGrandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {!loading && viewMode === 'monthly' && monthlyData && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-max divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  {monthDays.map((day) => (
                    <th key={day.toISOString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {format(day, 'EEE')}<br />{format(day, 'MMM d')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.last_name} {employee.first_name}
                    </td>
                    {monthDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const hours = monthlyHoursByEmployeeAndDay[`${employee.id}_${dayStr}`] || 0;

                      return (
                        <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                          {hours > 0 ? hours.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                      {monthlyEmployeeTotal(employee.id).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">Daily Total</td>
                  {monthDays.map((day) => (
                    <td key={day.toISOString()} className="px-4 py-3 text-center text-sm text-gray-900">
                      {monthlyDayTotal(day).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-sm text-gray-900 bg-blue-100">
                    {monthlyGrandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
