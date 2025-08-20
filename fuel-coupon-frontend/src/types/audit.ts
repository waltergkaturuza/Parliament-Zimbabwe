// src/types/audit.ts
export interface AuditLog {
  id: number;
  content_type: number;
  content_type_name: string;
  object_id: string;
  object_repr: string;
  action: string;
  action_display: string;
  description: string;
  changes: Record<string, any>;
  user: number | null;
  user_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  user_ip: string | null;
  user_agent: string;
  session_key: string;
  url: string;
  is_system_action: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity_display: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created: string;
  formatted_timestamp: string;
}

export interface AuditTransaction {
  id: number;
  action: string;
  content_type: string;
  object_id: string;
  object_repr: string;
  user: {
    id: number;
    username: string;
    full_name: string;
  };
  timestamp: string;
  description: string;
  severity: string;
  ip_address: string | null;
  changes: Record<string, any>;
  is_system_action: boolean;
}

export interface ComplianceReport {
  id: number;
  title: string;
  type: string;
  period: string;
  generated_date: string;
  compliance_rate: number;
  total_checks: number;
  violations: number;
  status: 'generating' | 'completed' | 'failed';
}

export interface AuditStats {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  success_rate: number;
  recent_activity: Array<{
    action: string;
    count: number;
  }>;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  event_type: string;
  severity: string;
  user: string;
  ip_address: string | null;
  description: string;
  user_agent: string;
}

export interface AuditTrail {
  id: number;
  timestamp: string;
  action: string;
  user: string;
  description: string;
  changes: Record<string, any>;
  severity: string;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: string;
  content_type?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  is_system_action?: boolean;
  page?: number;
  page_size?: number;
}