# Implementation Notes - Advanced Timesheet Requirements

## Overview
Implemented two key requirements for the timesheet functionality:
1. Show all store employees in timesheets, even without entries
2. Historical employee visibility based on hire/deletion dates

## Requirement 1: Show All Employees

**Implementation:**
- Modified the timesheet table to iterate through `employees` array instead of `entries`
- For each employee, look up their corresponding entry
- Display "-" for employees without entries
- Show "Add Entry" button for employees without entries
- Show "Edit" and "Delete" buttons for employees with entries

**Benefits:**
- Complete visibility of workforce for any given day
- Easy to identify who hasn't logged hours
- Quick access to add entries for any employee

## Requirement 2: Historical Employee Records

**Implementation:**
- Added `deleted_at` column to `employees` table for soft deletion
- Modified employee queries to filter based on date context:
  - **Management page**: Only shows active employees (`deleted_at IS NULL`)
  - **Timesheet page**: Shows employees based on the viewed date:
    - Employees created on or before the viewed date
    - AND either not deleted OR deleted after the viewed date

**Database Changes:**
```sql
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);
```

**Query Logic:**
```javascript
.lte('created_at', `${currentDate}T23:59:59`)
.or(`deleted_at.is.null,deleted_at.gt.${currentDate}T23:59:59`)
```

**Benefits:**
- New employees only appear from their hire date forward
- Deleted employees remain visible in historical timesheets
- Accurate historical reporting and compliance
- No data loss when removing employees

## How It Works

### Adding a New Employee (Jan 15, 2026)
- Employee appears in timesheets from Jan 15 onwards
- Does NOT appear in timesheets before Jan 15
- Appears in employee management page

### Deleting an Employee (Jan 20, 2026)
- `deleted_at` set to Jan 20, 2026
- Still appears in timesheets Jan 15-19
- Does NOT appear in timesheets Jan 20 onwards
- Does NOT appear in employee management page
- Historical data preserved

### Viewing Timesheet for Jan 17, 2026
- Shows employees hired on or before Jan 17
- Shows employees deleted after Jan 17 (or not deleted at all)
- Each employee row shows their entry or "-" if no hours logged

## Files Modified

1. **DATABASE_SCHEMA.md**
   - Added `deleted_at` column to employees table
   - Added migration SQL for existing databases

2. **components/timesheet/DailyTimesheet.tsx**
   - Updated `fetchEmployees()` with date-based filtering
   - Changed table to iterate over employees instead of entries
   - Added `openModalForEmployee()` function
   - Updated UI to show all employees with appropriate actions

3. **components/management/EmployeeManagement.tsx**
   - Updated `fetchEmployees()` to exclude soft-deleted employees
   - Changed `handleDelete()` to set `deleted_at` timestamp
   - Updated confirmation message

## Testing Checklist

- [ ] Run migration SQL in Supabase SQL Editor
- [ ] Add a new employee and verify they don't appear in past timesheets
- [ ] Delete an employee and verify they still appear in historical timesheets
- [ ] View a timesheet and confirm all active employees for that date are shown
- [ ] Add entries for employees without hours
- [ ] Verify deleted employees don't appear in management page
- [ ] Check that total hours only counts employees with entries
