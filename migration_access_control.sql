-- TerzoTimeSheets: Migration Script for Adding User-Store Access Control
-- Run this if you already have the application set up and want to add access control

-- ============================================
-- STEP 1: Create user_stores table
-- ============================================

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

-- ============================================
-- STEP 2: Drop old RLS policies
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated users full access to stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users full access to employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users full access to timesheet_entries" ON timesheet_entries;

-- ============================================
-- STEP 3: Create new store-based RLS policies
-- ============================================

-- STORES policies
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

-- EMPLOYEES policies
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

-- TIMESHEET_ENTRIES policies
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

-- USER_STORES policies
CREATE POLICY "Users can view their store assignments" ON user_stores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their store assignments" ON user_stores
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 4: Assign existing users to all stores
-- ============================================

-- This maintains current access for existing users
-- All users will have access to all stores (same as before)
-- You can adjust this later by removing specific assignments

INSERT INTO user_stores (user_id, store_id)
SELECT u.id, s.id
FROM auth.users u
CROSS JOIN stores s
ON CONFLICT (user_id, store_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all user-store assignments
SELECT 
  u.email,
  s.name as store_name,
  us.created_at
FROM user_stores us
JOIN auth.users u ON us.user_id = u.id
JOIN stores s ON us.store_id = s.id
ORDER BY u.email, s.name;

-- Count assignments per user
SELECT 
  u.email,
  COUNT(us.store_id) as store_count
FROM auth.users u
LEFT JOIN user_stores us ON u.id = us.user_id
GROUP BY u.id, u.email
ORDER BY u.email;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- After running this migration:
-- 1. All existing users maintain their current access
-- 2. New stores created through the app will automatically be assigned to the creator
-- 3. You can adjust access by modifying the user_stores table
-- 4. See USER_STORE_MANAGEMENT.md for detailed usage instructions
