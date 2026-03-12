import { NextRequest, NextResponse } from 'next/server';
import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { parseReadonlySessionToken } from '@/lib/auth/readonly';
import { createAdminClient } from '@/lib/supabase/admin';

const COOKIE_NAME = 'readonly_timesheets_session';

type TimesheetEntryRow = {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours: number;
};

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  hiring_date: string;
  firing_date: string | null;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = parseReadonlySessionToken(token);
  if (!session) {
    return unauthorized();
  }

  const mode = request.nextUrl.searchParams.get('mode');
  const supabase = createAdminClient();
  const storeId = session.storeId;

  if (mode === 'options') {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hiring_date, firing_date')
      .eq('store_id', storeId)
      .is('firing_date', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (employeesError) {
      return NextResponse.json({ error: employeesError.message }, { status: 500 });
    }

    return NextResponse.json({ store, employees: employees ?? [] });
  }

  if (mode === 'daily') {
    const date = request.nextUrl.searchParams.get('date');
    const employeeId = request.nextUrl.searchParams.get('employeeId');

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const { data: allEmployees, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hiring_date, firing_date')
      .eq('store_id', storeId)
      .is('firing_date', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    const filteredEmployees = employeeId
      ? (allEmployees ?? []).filter((employee) => employee.id === employeeId)
      : (allEmployees ?? []);

    if (filteredEmployees.length === 0) {
      return NextResponse.json({ employees: [], entries: [], date });
    }

    const { data: entries, error: entriesError } = await supabase
      .from('timesheet_entries')
      .select('id, employee_id, date, clock_in, clock_out, hours')
      .eq('date', date)
      .in('employee_id', filteredEmployees.map((employee) => employee.id))
      .order('clock_in', { ascending: true });

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    return NextResponse.json({
      date,
      employees: filteredEmployees,
      entries: (entries ?? []) as TimesheetEntryRow[],
    });
  }

  if (mode === 'weekly') {
    const weekStartParam = request.nextUrl.searchParams.get('weekStart');
    const employeeId = request.nextUrl.searchParams.get('employeeId');

    if (!weekStartParam) {
      return NextResponse.json({ error: 'Missing weekStart' }, { status: 400 });
    }

    const parsedWeekStart = startOfWeek(parseISO(weekStartParam), { weekStartsOn: 1 });
    const parsedWeekEnd = endOfWeek(parsedWeekStart, { weekStartsOn: 1 });
    const weekStart = format(parsedWeekStart, 'yyyy-MM-dd');
    const weekEnd = format(parsedWeekEnd, 'yyyy-MM-dd');

    const { data: allEmployees, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hiring_date, firing_date')
      .eq('store_id', storeId)
      .is('firing_date', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    const filteredEmployees = employeeId
      ? (allEmployees ?? []).filter((employee) => employee.id === employeeId)
      : (allEmployees ?? []);

    if (filteredEmployees.length === 0) {
      return NextResponse.json({ employees: [], entries: [], weekStart, weekEnd });
    }

    const { data: entries, error: entriesError } = await supabase
      .from('timesheet_entries')
      .select('id, employee_id, date, clock_in, clock_out, hours')
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .in('employee_id', filteredEmployees.map((employee) => employee.id));

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    return NextResponse.json({
      weekStart,
      weekEnd,
      employees: filteredEmployees,
      entries: (entries ?? []) as TimesheetEntryRow[],
    });
  }

  if (mode === 'monthly') {
    const monthStartParam = request.nextUrl.searchParams.get('monthStart');
    const employeeId = request.nextUrl.searchParams.get('employeeId');

    if (!monthStartParam) {
      return NextResponse.json({ error: 'Missing monthStart' }, { status: 400 });
    }

    const parsedMonthStart = startOfMonth(parseISO(monthStartParam));
    const parsedMonthEnd = endOfMonth(parsedMonthStart);
    const monthStart = format(parsedMonthStart, 'yyyy-MM-dd');
    const monthEnd = format(parsedMonthEnd, 'yyyy-MM-dd');

    const { data: allEmployees, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hiring_date, firing_date')
      .eq('store_id', storeId)
      .is('firing_date', null)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    const filteredEmployees = employeeId
      ? (allEmployees ?? []).filter((employee) => employee.id === employeeId)
      : (allEmployees ?? []);

    if (filteredEmployees.length === 0) {
      return NextResponse.json({ employees: [], entries: [], monthStart, monthEnd });
    }

    const { data: entries, error: entriesError } = await supabase
      .from('timesheet_entries')
      .select('id, employee_id, date, clock_in, clock_out, hours')
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('employee_id', filteredEmployees.map((employee) => employee.id));

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    return NextResponse.json({
      monthStart,
      monthEnd,
      employees: filteredEmployees,
      entries: (entries ?? []) as TimesheetEntryRow[],
    });
  }

  return NextResponse.json({ error: 'Unsupported mode' }, { status: 400 });
}
