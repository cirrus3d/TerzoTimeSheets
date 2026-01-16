# Audit Logging System

## Overview
The TerzoTimeSheets application includes a comprehensive audit logging system that tracks all Create, Read, Update, and Delete (CRUD) operations performed by users. This provides full accountability and helps with compliance, debugging, and understanding system usage.

## Features

### What Gets Logged
- **Timesheet Entries**: Creation, updates, and deletion of clock-in/out records
- **Employees**: Adding new employees, updating employee information, hiring/firing dates
- **Stores**: Creating new stores, renaming stores, and store deletion
- **Daily Comments**: Creating and updating daily notes and earnings

### Information Captured
For each action, the system logs:
- **User Information**: User ID and email of who performed the action
- **Action Type**: CREATE, UPDATE, or DELETE
- **Entity Details**: What type of entity was affected and its ID
- **Entity Name**: Human-readable name (employee name, store name, etc.)
- **Store Association**: Which store the action relates to (for filtering)
- **Changes**: For updates, captures before/after values
- **Metadata**: Additional context like dates for timesheet entries
- **Timestamp**: Exact date and time of the action

## Database Schema

### audit_logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Who performed the action
  user_email TEXT NOT NULL,        -- User's email for easy identification
  action TEXT NOT NULL,            -- 'CREATE', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL,       -- 'timesheet_entry', 'employee', 'store', 'daily_comment'
  entity_id UUID NOT NULL,         -- ID of the affected entity
  entity_name TEXT,                -- Human-readable name
  store_id UUID,                   -- Associated store (for filtering)
  changes JSONB,                   -- Before/after values for updates
  metadata JSONB,                  -- Additional context
  created_at TIMESTAMPTZ NOT NULL
);
```

## How to Use

### Viewing Audit Logs
1. Navigate to **Audit Log** from the main navigation menu
2. Use filters to narrow down logs:
   - **Store**: View logs for a specific store or all stores
   - **Entity Type**: Filter by timesheet entries, employees, stores, or daily comments
   - **Action**: Show only CREATE, UPDATE, or DELETE actions
3. Paginate through results (50 logs per page)
4. Click "View Changes" to see detailed before/after values for updates

### Example Audit Log Entry

**Timesheet Entry Update:**
```json
{
  "user_email": "manager@terzo.com",
  "action": "UPDATE",
  "entity_type": "timesheet_entry",
  "entity_name": "John Doe",
  "store_id": "store-uuid",
  "changes": {
    "before": {
      "clock_in": "09:00",
      "clock_out": "17:00",
      "hours": 8
    },
    "after": {
      "clock_in": "09:00",
      "clock_out": "18:00",
      "hours": 9
    }
  },
  "metadata": {
    "date": "2026-01-16"
  }
}
```

## Security & Access Control

### Row Level Security (RLS)
- Users can only view audit logs for stores they have access to
- Audit logs are automatically filtered based on user-store relationships
- System administrators can see all logs

### Automatic Logging
- All logging happens automatically when CRUD operations are performed
- No manual intervention required
- Logs are created even if the main operation fails (for debugging)

## Implementation Details

### Client-Side Logging
For client components (React components), use the `logAuditClient` function:

```typescript
import { logAuditClient } from '@/lib/utils/audit';

await logAuditClient(supabase, {
  action: 'CREATE',
  entityType: 'timesheet_entry',
  entityId: entry.id,
  entityName: 'John Doe',
  storeId: selectedStoreId,
  metadata: { date: currentDate, hours: 8 },
});
```

### Server-Side Logging
For server actions, use the `logAudit` function:

```typescript
import { logAudit } from '@/lib/utils/audit';

await logAudit({
  action: 'UPDATE',
  entityType: 'employee',
  entityId: employeeId,
  entityName: `${firstName} ${lastName}`,
  storeId: storeId,
  changes: { before: oldValues, after: newValues },
});
```

### Database Function
The system also provides a PostgreSQL function for direct database logging:

```sql
SELECT log_audit(
  'CREATE',                    -- action
  'employee',                  -- entity_type
  employee_id,                 -- entity_id
  'John Doe',                  -- entity_name (optional)
  store_id,                    -- store_id (optional)
  '{"field": "value"}'::jsonb, -- changes (optional)
  '{"key": "value"}'::jsonb    -- metadata (optional)
);
```

## Maintenance

### Data Retention
Consider implementing a data retention policy:
- Keep audit logs for compliance period (e.g., 2-7 years)
- Archive old logs to separate storage
- Implement automatic cleanup for logs older than retention period

### Performance
- Indexes are created on frequently queried columns (user_id, entity_type, store_id, created_at, action)
- Use pagination when displaying logs (default: 50 per page)
- Consider partitioning the table if log volume becomes very high

## Compliance & Legal

### GDPR Considerations
- Audit logs contain personal data (user emails)
- Ensure data retention complies with local regulations
- Provide ability to export user's audit history on request
- Consider anonymization for long-term retention

### Use Cases
- **Compliance**: Prove who did what and when
- **Debugging**: Trace issues back to specific actions
- **Training**: Identify areas where users need guidance
- **Security**: Detect unauthorized or suspicious activity
- **Accountability**: Hold users responsible for their actions

## Migration

To set up audit logging in your database, run:

```bash
psql -h your-db-host -d your-database -f migration_audit_logs.sql
```

Or use the Supabase SQL Editor to execute the contents of `migration_audit_logs.sql`.

## Future Enhancements

Potential improvements to the audit system:
1. **Real-time Notifications**: Alert admins of critical actions
2. **Advanced Search**: Full-text search across changes and metadata
3. **Export Functionality**: Download audit logs as CSV/PDF
4. **Audit Reports**: Automated reports of user activity
5. **Retention Policies**: Automatic archival and cleanup
6. **Anomaly Detection**: AI-powered suspicious activity detection
