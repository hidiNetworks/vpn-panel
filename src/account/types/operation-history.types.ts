export type OperationType = 'create' | 'update' | 'delete';
export type OperationStatus = 'success' | 'partial' | 'failed';
export type PanelOperationStatus = 'success' | 'failed';

export interface PanelOperationResult {
  panelId: string;
  panelName: string;
  status: PanelOperationStatus;
  error?: string;
}

export interface OperationHistoryEntry {
  operation: OperationType;
  timestamp: Date;
  status: OperationStatus;
  panels: PanelOperationResult[];
}
