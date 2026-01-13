# Daily Comments Feature

## Overview
The Daily Comments feature allows admins to add optional notes or comments for each day in the timesheet. Comments are stored per store and date, and are displayed below the total hours summary.

## What's Changed

### Database Changes
1. **New Table**: `daily_comments`
   - Stores comments per store and date
   - Optional text field (non-mandatory)
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
  comment: string | null;
  created_at: string;
  updated_at: string;
}
```

### UI Updates
The [DailyTimesheet](components/timesheet/DailyTimesheet.tsx) component now includes:
- Comment textarea below the total hours display
- Auto-save on blur (when focus leaves the textarea)
- Visual feedback while saving
- Comments persist across date navigation

## How It Works

1. **Viewing Comments**: When a date is selected, the component fetches any existing comment for that store/date combination
2. **Editing Comments**: Admins can type directly into the textarea
3. **Saving**: Comments are automatically saved when the user clicks outside the textarea (onBlur event)
4. **Empty Comments**: If a comment is empty, it's stored as NULL in the database

## Features
- ✅ Non-mandatory (optional)
- ✅ Auto-save functionality
- ✅ Editable at any time
- ✅ Per-store access control (admins only see comments for their assigned stores)
- ✅ Displayed below total hours summary
- ✅ Visual feedback during save operation

## Usage

1. Navigate to the dashboard and select a store
2. Choose a date with timesheet entries
3. Scroll to the bottom where you see "Total Hours"
4. Enter any notes in the "Daily Comment" textarea
5. Click outside the textarea or navigate to another element to auto-save
6. Comments are automatically loaded when you return to the date

## Security
- Row Level Security (RLS) policies ensure users can only view/edit comments for stores they're assigned to
- Same access control as timesheet entries and employee data
