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
