# User-Store Access Management

## Overview

The TerzoTimeSheets application now supports store-based access control. Admin users can only view and manage stores they are explicitly assigned to, along with the employees and timesheet entries for those stores.

## How It Works

### Database Structure

A new `user_stores` table links users to stores with a many-to-many relationship:
- Each user can be assigned to multiple stores
- Each store can have multiple users assigned to it
- Row Level Security (RLS) policies automatically enforce these permissions

### Automatic Filtering

All data queries are automatically filtered by the RLS policies:
- **Stores**: Users only see stores they're assigned to in the dropdown
- **Employees**: Users only see employees from their assigned stores
- **Timesheet Entries**: Users can only view/edit entries for employees in their assigned stores
- **Reports**: Reports only show data from assigned stores

## Assigning Users to Stores

### Method 1: Direct SQL (Recommended for Initial Setup)

Run these commands in your Supabase SQL Editor:

```sql
-- Get user IDs from the auth.users table
SELECT id, email FROM auth.users;

-- Get store IDs
SELECT id, name FROM stores;

-- Assign a user to a store
INSERT INTO user_stores (user_id, store_id) 
VALUES ('USER_UUID_HERE', 'STORE_UUID_HERE');

-- Assign a user to multiple stores
INSERT INTO user_stores (user_id, store_id) VALUES
  ('USER_UUID_HERE', 'STORE_1_UUID'),
  ('USER_UUID_HERE', 'STORE_2_UUID'),
  ('USER_UUID_HERE', 'STORE_3_UUID');

-- View all user-store assignments
SELECT 
  u.email,
  s.name as store_name,
  us.created_at
FROM user_stores us
JOIN auth.users u ON us.user_id = u.id
JOIN stores s ON us.store_id = s.id
ORDER BY u.email, s.name;
```

### Method 2: Automatic Assignment for New Stores

When a user creates a new store through the application, they are automatically assigned to that store. The StoreManagement component handles this automatically.

### Method 3: Remove Store Access

```sql
-- Remove a user's access to a specific store
DELETE FROM user_stores 
WHERE user_id = 'USER_UUID_HERE' 
  AND store_id = 'STORE_UUID_HERE';

-- Remove all store access for a user
DELETE FROM user_stores 
WHERE user_id = 'USER_UUID_HERE';
```

## Migration Guide

If you're upgrading from the previous version without access control:

1. **Run the migration SQL** from DATABASE_SCHEMA.md to create the `user_stores` table
2. **Assign existing users to all stores** (maintains current access):
   ```sql
   INSERT INTO user_stores (user_id, store_id)
   SELECT u.id, s.id
   FROM auth.users u
   CROSS JOIN stores s
   ON CONFLICT (user_id, store_id) DO NOTHING;
   ```
3. **Adjust access as needed** by removing unnecessary assignments

## Common Scenarios

### New User Setup
```sql
-- Create user in Supabase Auth dashboard first, then:
INSERT INTO user_stores (user_id, store_id) 
VALUES ('NEW_USER_UUID', 'STORE_UUID');
```

### Multi-Store Manager
```sql
-- A manager overseeing 3 locations:
INSERT INTO user_stores (user_id, store_id) VALUES
  ('MANAGER_UUID', 'STORE_1_UUID'),
  ('MANAGER_UUID', 'STORE_2_UUID'),
  ('MANAGER_UUID', 'STORE_3_UUID');
```

### Single-Store Employee
```sql
-- Employee managing just one location:
INSERT INTO user_stores (user_id, store_id) 
VALUES ('EMPLOYEE_UUID', 'THEIR_STORE_UUID');
```

### Transfer User to Different Store
```sql
-- Remove old assignment
DELETE FROM user_stores 
WHERE user_id = 'USER_UUID' AND store_id = 'OLD_STORE_UUID';

-- Add new assignment
INSERT INTO user_stores (user_id, store_id) 
VALUES ('USER_UUID', 'NEW_STORE_UUID');
```

## Security Notes

- All access control is enforced at the database level through RLS policies
- Users cannot bypass these restrictions through the application
- Attempting to access unauthorized data will result in empty results (no errors)
- The `user_stores` table itself is protected by RLS - users can only see their own assignments

## Troubleshooting

**User can't see any stores:**
- Verify the user is assigned to at least one store in the `user_stores` table
- Check that the stores still exist and haven't been deleted

**User can't create new stores:**
- The `stores` table allows INSERT for all authenticated users
- After creation, the user is automatically assigned to the new store

**Data not showing up after assignment:**
- Have the user log out and log back in
- Check browser console for any RLS policy errors
- Verify the assignment exists in the database

**Employee not appearing in timesheet:**
- Check the employee's hiring_date and firing_date
- Ensure the employee belongs to a store the user has access to
- Verify the current date is within the employee's employment period
