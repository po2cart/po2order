/**
 * ERP adapter types
 */

export interface ERPConnectionStatus {
  connected: boolean;
  lastSync?: Date;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  timeMs: number;
}
