# TerzoTimeSheets - Supabase Database Schema

## Tables

### stores
```sql
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### employees
```sql
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  hiring_date DATE NOT NULL,
  firing_date DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Note:** 
- `hiring_date`: The date when the employee started working. They will appear in timesheets from this date forward.
- `firing_date`: The date when the employee was terminated. They will appear in timesheets up to (but not including) this date. NULL means currently employed.

### timesheet_entries
```sql
CREATE TABLE timesheet_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);
```

## Indexes
```sql
CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_employees_hiring_date ON employees(hiring_date);
CREATE INDEX idx_employees_firing_date ON employees(firing_date);
CREATE INDEX idx_timesheet_entries_employee_id ON timesheet_entries(employee_id);
CREATE INDEX idx_timesheet_entries_date ON timesheet_entries(date);
```

## RLS (Row Level Security) Policies

Enable RLS on all tables:
```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
```

Allow authenticated users to do everything (simplified for admin-only access):
```sql
CREATE POLICY "Allow authenticated users full access to stores" ON stores
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to employees" ON employees
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to timesheet_entries" ON timesheet_entries
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands above in order
4. Create an admin user in Authentication > Users
5. Copy your project URL and anon key to .env.local

## Migration: Adding hiring_date and firing_date columns

If you already have the employees table created, run this migration:
```sql
-- Add hiring_date and firing_date columns
ALTER TABLE employees ADD COLUMN hiring_date DATE;
ALTER TABLE employees ADD COLUMN firing_date DATE DEFAULT NULL;

-- Set hiring_date to created_at date for existing employees
UPDATE employees SET hiring_date = created_at::DATE WHERE hiring_date IS NULL;

-- Make hiring_date NOT NULL after setting values
ALTER TABLE employees ALTER COLUMN hiring_date SET NOT NULL;

-- Remove old deleted_at column if it exists
ALTER TABLE employees DROP COLUMN IF EXISTS deleted_at;
DROP INDEX IF EXISTS idx_employees_deleted_at;

-- Create indexes for performance
CREATE INDEX idx_employees_hiring_date ON employees(hiring_date);
CREATE INDEX idx_employees_firing_date ON employees(firing_date);
```
