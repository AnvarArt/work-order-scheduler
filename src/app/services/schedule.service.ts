import { Injectable } from '@angular/core';
import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';
import { SAMPLE_WORK_CENTERS, getSampleWorkOrders } from '../data/sample-data';

const STORAGE_KEY_WORK_ORDERS = 'work-order-timeline:workOrders';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private workCenters: WorkCenterDocument[] = [...SAMPLE_WORK_CENTERS];
  private workOrders: WorkOrderDocument[] = this.loadWorkOrders();

  getWorkCenters(): WorkCenterDocument[] {
    return this.workCenters;
  }

  getWorkOrders(): WorkOrderDocument[] {
    return [...this.workOrders];
  }

  getWorkOrderById(docId: string): WorkOrderDocument | undefined {
    return this.workOrders.find((wo) => wo.docId === docId);
  }

  addWorkOrder(order: WorkOrderDocument): void {
    this.workOrders.push(order);
    this.persistWorkOrders();
  }

  updateWorkOrder(docId: string, data: WorkOrderDocument['data']): void {
    const idx = this.workOrders.findIndex((wo) => wo.docId === docId);
    if (idx === -1) return;
    this.workOrders[idx] = { ...this.workOrders[idx], data: { ...data } };
    this.persistWorkOrders();
  }

  deleteWorkOrder(docId: string): void {
    this.workOrders = this.workOrders.filter((wo) => wo.docId !== docId);
    this.persistWorkOrders();
  }

  /**
   * Check if a date range overlaps with any other order on the same work center.
   * Exclude order with excludeDocId (for edit mode).
   */
  hasOverlap(
    workCenterId: string,
    startDate: string,
    endDate: string,
    excludeDocId?: string
  ): boolean {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    for (const wo of this.workOrders) {
      if (wo.data.workCenterId !== workCenterId) continue;
      if (wo.docId === excludeDocId) continue;
      const woStart = new Date(wo.data.startDate).getTime();
      const woEnd = new Date(wo.data.endDate).getTime();
      if (start < woEnd && end > woStart) return true;
    }
    return false;
  }

  private loadWorkOrders(): WorkOrderDocument[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORK_ORDERS);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkOrderDocument[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return getSampleWorkOrders();
  }

  private persistWorkOrders(): void {
    try {
      localStorage.setItem(STORAGE_KEY_WORK_ORDERS, JSON.stringify(this.workOrders));
    } catch (_) {}
  }
}
