-- Migration: Add daily comments feature
-- Description: Adds a table to store daily comments for each store

-- Create daily_comments table
CREATE TABLE IF NOT EXISTS daily_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  comment TEXT,
  earnings DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- Add index for efficient queries
CREATE INDEX idx_daily_comments_store_date ON daily_comments(store_id, date);

-- Enable RLS
ALTER TABLE daily_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access comments for stores they are assigned to
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
