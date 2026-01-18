export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type AuditEntityType = 'timesheet_entry' | 'employee' | 'store' | 'daily_comment' | 'daily_earnings' | 'responsible_user';

interface LogAuditParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  storeId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Client-side audit logging utility
 * Call this from client components to log changes
 */
export async function logAuditClient(
  supabase: any,
  params: LogAuditParams
): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user for audit log:', userError);
      return;
    }

    // Call the database function to create audit log
    const { error } = await supabase.rpc('log_audit', {
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId,
      p_entity_name: params.entityName || null,
      p_store_id: params.storeId || null,
      p_changes: params.changes || null,
      p_metadata: params.metadata || null,
    });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Error in logAuditClient:', error);
  }
}
