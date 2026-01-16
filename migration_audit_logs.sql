-- Migration: Add audit logging system
-- Description: Tracks all CRUD operations with user and timestamp information

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL, -- 'timesheet_entry', 'employee', 'store', 'daily_comment'
  entity_id UUID NOT NULL,
  entity_name TEXT, -- Human-readable name (employee name, store name, etc.)
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- Optional: for filtering by store
  changes JSONB, -- Stores before/after values for updates
  metadata JSONB, -- Additional context (e.g., date for timesheet entries)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_store_id ON audit_logs(store_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their assigned stores
CREATE POLICY "Users can view audit logs for their stores"
  ON audit_logs
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id 
      FROM user_stores 
      WHERE user_id = auth.uid()
    )
    OR store_id IS NULL -- Allow viewing system-wide actions if no store specified
  );

-- Policy: Only authenticated users can insert audit logs (handled by functions)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically log actions (can be called from application)
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_audit_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create audit logs';
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    entity_type,
    entity_id,
    entity_name,
    store_id,
    changes,
    metadata
  )
  VALUES (
    v_user_id,
    v_user_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_store_id,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_audit TO authenticated;

COMMENT ON TABLE audit_logs IS 'Tracks all CRUD operations for accountability and compliance';
COMMENT ON FUNCTION log_audit IS 'Helper function to create audit log entries from the application';
