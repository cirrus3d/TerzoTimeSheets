# Daily Comments Feature

## Overview
The Daily Comments feature allows admins to add optional notes or comments for each day in the timesheet, as well as track daily earnings in euros. Comments and earnings are stored per store and date, and are displayed below the total hours summary.

## What's Changed

### Database Changes
1. **New Table**: `daily_comments`
   - Stores comments and earnings per store and date
   - Optional text field for comments (non-mandatory)
   - Optional decimal field for earnings in euros (non-mandatory)
   - Unique constraint on (store_id, date) combination
   - Full RLS policies for store-based access control

### Migration
Run [migration_daily_comments.sql](migration_daily_comments.sql) in your Supabase SQL Editor to add the new table and policies.

### Type Updates
Added `DailyComment` interface in [types/database.ts](types/database.ts):
```typescript
export interface DailyComment {
  id: string;
  store_id: string;
  date: string;
  earnings: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}
```

### UI Updates
The [DailyTimesheet](components/timesheet/DailyTimesheet.tsx) component now includes:
- Daily earnings input field (in euros) below the comment field
- Auto-save on blur (when focus leaves the textarea or input)
- Visual feedback while saving
- Comments and earningfeedback while saving
- Comments persist across date navigation

## How It Works
 & Earnings**: When a date is selected, the component fetches any existing comment and earnings for that store/date combination
2. **Editing**: Admins can type directly into the textarea or enter earnings in the number input
3. **Saving**: Data is automatically saved when the user clicks outside the textarea or input field (onBlur event)
4. **Empty Values**: If a comment is empty or earnings is empty, they'reen the user clicks outside the textarea (onBlur event)
4. **Empty Comments**: If a comment is empty, it's stored as NULL in the database

## Features
- ✅ Non-mandatory (optional)
- ✅ Auto-save functionality
- ✅ Track daily earnings in euros with decimal precision
- ✅ Per-store access control (admins only see comments and earning
- ✅ Per-store access control (admins only see comments for their assigned stores)
- ✅ Displayed below total hours summary
- ✅ Visual feedback during save operation

## Usage

1. Navigate to the dashboard and select a store
2. Choose a date with timesheet entries
3. Scroll to the bottom where you see "Total Hours"
4. Enter daily earnings in the "Daily Earnings (€)" input field
6. Click outside the fields or navigate to another element to auto-save
7. Comments and earningutside the textarea or navigate to another element to auto-save
6. Comments are automatically loaded when you return to the date
and earnings 
## Security
- Row Level Security (RLS) policies ensure users can only view/edit comments for stores they're assigned to
- Same access control as timesheet entries and employee data
