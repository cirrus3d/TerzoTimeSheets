export interface Store {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  hiring_date: string;
  firing_date: string | null;
  created_at: string;
  updated_at: string;
  store?: Store;
}

export interface TimesheetEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface CreateTimesheetEntry {
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
}

export interface UpdateTimesheetEntry {
  clock_in?: string;
  clock_out?: string;
}

export interface UserStore {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
  store?: Store;
}

export interface DailyComment {
  id: string;
  store_id: string;
  date: string;
  comment: string | null;
  earnings: number | null;
  created_at: string;
  updated_at: string;
}
