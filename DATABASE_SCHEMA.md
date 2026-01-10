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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
```

**Note:** The `deleted_at` column enables soft deletion. When an employee is "deleted", we set this timestamp instead of removing the record. This ensures deleted employees still appear in historical timesheets but not in current/future ones.

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
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);
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

## Migration: Adding deleted_at column

If you already have the employees table created, run this migration:
```sql
-- Add deleted_at column to existing employees table
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);
```
