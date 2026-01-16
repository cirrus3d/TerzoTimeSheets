-- Migration: Add responsible_user_id to daily_comments table
-- Description: Tracks which admin user is responsible for keeping the daily earnings

-- Add responsible_user_id column to daily_comments table
ALTER TABLE daily_comments 
ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_comments_responsible_user 
ON daily_comments(responsible_user_id);

COMMENT ON COLUMN daily_comments.responsible_user_id IS 'User responsible for keeping the daily earnings';

-- Create user_profiles table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_store_users(UUID);

-- Create a function to get users for a store
CREATE OR REPLACE FUNCTION get_store_users(p_store_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_email VARCHAR(255),
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    au.email,
    COALESCE(up.display_name, au.email) as display_name
  FROM user_stores us
  JOIN auth.users au ON au.id = us.user_id
  LEFT JOIN user_profiles up ON up.id = us.user_id
  WHERE us.store_id = p_store_id
  ORDER BY COALESCE(up.display_name, au.email);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_store_users TO authenticated;

COMMENT ON FUNCTION get_store_users IS 'Returns all users with access to a specific store';
