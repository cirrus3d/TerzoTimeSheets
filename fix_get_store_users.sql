-- STEP 1: Drop the old function completely (with all possible signatures)
DROP FUNCTION IF EXISTS get_store_users(UUID);

-- STEP 2: Recreate the function with display_name
CREATE FUNCTION get_store_users(p_store_id UUID)
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

-- STEP 3: Grant execute permission
GRANT EXECUTE ON FUNCTION get_store_users TO authenticated;

-- STEP 4: Verify the function was created correctly
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_store_users';
