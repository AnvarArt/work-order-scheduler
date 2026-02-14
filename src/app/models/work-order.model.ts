/**
 * Work order status as per spec.
 * open = Blue, in-progress = Blue/Purple, complete = Green, blocked = Yellow/Orange
 */
export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string; // ISO format e.g. "2025-01-15"
    endDate: string;
  };
}
