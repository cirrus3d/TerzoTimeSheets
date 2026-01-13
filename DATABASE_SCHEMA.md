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

### user_stores
```sql
CREATE TABLE user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);
```

**Note:** This table manages which stores each admin user has access to. Users can only view and manage stores they are assigned to.

### daily_comments
```sql
CREATE TABLE daily_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date)
);
```

**Note:** This table stores optional daily comments for each store. Admins can add notes or comments for any day in the timesheet view.

## Indexes
```sql
CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_employees_hiring_date ON employees(hiring_date);
CREATE INDEX idx_employees_firing_date ON employees(firing_date);
CREATE INDEX idx_timesheet_entries_employee_id ON timesheet_entries(employee_id);
CREATE INDEX idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX idx_daily_comments_store_date ON daily_comments(store_id, date);
```

## RLS (Row Level Security) Policies

Enable RLS on all tables:
```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
```

Store-based access control policies:
```sql
-- Users can only access stores they are assigned to
CREATE POLICY "Users can view their assigned stores" ON stores
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assigned stores" ON stores
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stores" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their assigned stores" ON stores
  FOR DELETE TO authenticated
  USING (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Users can only access employees from their assigned stores
CREATE POLICY "Users can view employees from their stores" ON employees
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employees to their stores" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update employees from their stores" ON employees
  FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete employees from their stores" ON employees
  FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Users can only access timesheet entries from their assigned stores
CREATE POLICY "Users can view timesheet entries from their stores" ON timesheet_entries
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timesheet entries for their stores" ON timesheet_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timesheet entries from their stores" ON timesheet_entries
  FOR UPDATE TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timesheet entries from their stores" ON timesheet_entries
  FOR DELETE TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Users can manage their own store assignments
CREATE POLICY "Users can view their store assignments" ON user_stores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their store assignments" ON user_stores
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only access daily comments from their assigned stores
CREATE POLICY "Users can view comments for their assigned stores" ON daily_comments
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments for their assigned stores" ON daily_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update comments for their assigned stores" ON daily_comments
  FOR UPDATE TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete comments for their assigned stores" ON daily_comments
  FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands above in order
4. Create an admin user in Authentication > Users
5. Assign the admin user to stores using the user_stores table:
   ```sql
   -- Replace YOUR_USER_ID and YOUR_STORE_ID with actual UUIDs
   INSERT INTO user_stores (user_id, store_id) 
   VALUES ('YOUR_USER_ID', 'YOUR_STORE_ID');
   ```
6. Copy your project URL and anon key to .env.local

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

## Migration: Adding user_stores table and updating RLS policies

If you already have the application running with the old RLS policies, run this migration:

```sql
-- Create user_stores table
CREATE TABLE user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Create indexes
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);

-- Enable RLS
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow authenticated users full access to stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users full access to employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users full access to timesheet_entries" ON timesheet_entries;

-- Create new store-based policies (see RLS section above for full policy definitions)

-- IMPORTANT: Assign existing users to all existing stores to maintain current access
-- Run this after creating the table to give existing users access to existing stores:
INSERT INTO user_stores (user_id, store_id)
SELECT u.id, s.id
FROM auth.users u
CROSS JOIN stores s
ON CONFLICT (user_id, store_id) DO NOTHING;

-- After this migration, new stores must be assigned to users via the user_stores table
```
