-- TerzoTimeSheets: Quick Setup SQL Script
-- Run this in your Supabase SQL Editor after creating your project

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
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

-- Timesheet entries table
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

-- User-store assignments table
CREATE TABLE user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_employees_hiring_date ON employees(hiring_date);
CREATE INDEX idx_employees_firing_date ON employees(firing_date);
CREATE INDEX idx_timesheet_entries_employee_id ON timesheet_entries(employee_id);
CREATE INDEX idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES - STORES
-- ============================================

-- Users can view stores they're assigned to
CREATE POLICY "Users can view their assigned stores" ON stores
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Users can update stores they're assigned to
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

-- All authenticated users can create new stores
CREATE POLICY "Users can insert stores" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can delete stores they're assigned to
CREATE POLICY "Users can delete their assigned stores" ON stores
  FOR DELETE TO authenticated
  USING (
    id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. CREATE RLS POLICIES - EMPLOYEES
-- ============================================

-- Users can view employees from their stores
CREATE POLICY "Users can view employees from their stores" ON employees
  FOR SELECT TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Users can insert employees to their stores
CREATE POLICY "Users can insert employees to their stores" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Users can update employees from their stores
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

-- Users can delete employees from their stores
CREATE POLICY "Users can delete employees from their stores" ON employees
  FOR DELETE TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. CREATE RLS POLICIES - TIMESHEET ENTRIES
-- ============================================

-- Users can view timesheet entries from their stores
CREATE POLICY "Users can view timesheet entries from their stores" ON timesheet_entries
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Users can insert timesheet entries for their stores
CREATE POLICY "Users can insert timesheet entries for their stores" ON timesheet_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Users can update timesheet entries from their stores
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

-- Users can delete timesheet entries from their stores
CREATE POLICY "Users can delete timesheet entries from their stores" ON timesheet_entries
  FOR DELETE TO authenticated
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN user_stores us ON e.store_id = us.store_id
      WHERE us.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. CREATE RLS POLICIES - USER_STORES
-- ============================================

-- Users can view their own store assignments
CREATE POLICY "Users can view their store assignments" ON user_stores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can manage their own store assignments
CREATE POLICY "Users can manage their store assignments" ON user_stores
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 8. SETUP COMPLETE
-- ============================================

-- Next steps:
-- 1. Create a user in Authentication > Users
-- 2. Create some stores
-- 3. Assign users to stores using:
--    INSERT INTO user_stores (user_id, store_id) VALUES ('USER_UUID', 'STORE_UUID');
-- 4. Start using the application!
