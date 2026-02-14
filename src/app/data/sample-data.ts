import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';

/**
 * Sample work centers matching design screenshots.
 */
export const SAMPLE_WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'Rodriques Electrics' } },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
  { docId: 'wc-4', docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
  { docId: 'wc-5', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
];

/**
 * Sample work orders (8+), all 4 statuses, multiple non-overlapping on same center.
 * Names and work centers aligned with design screenshots.
 */
function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getSampleWorkOrders(): WorkOrderDocument[] {
  return [
    {
      docId: 'wo-1',
      docType: 'workOrder',
      data: {
        name: 'entrix Ltd',
        workCenterId: 'wc-1',
        status: 'complete',
        startDate: daysFromToday(-25),
        endDate: daysFromToday(-18),
      },
    },
    {
      docId: 'wo-2',
      docType: 'workOrder',
      data: {
        name: 'Rodriques Electrics',
        workCenterId: 'wc-2',
        status: 'in-progress',
        startDate: daysFromToday(-5),
        endDate: daysFromToday(25),
      },
    },
    {
      docId: 'wo-3',
      docType: 'workOrder',
      data: {
        name: 'Konsulting Inc',
        workCenterId: 'wc-3',
        status: 'in-progress',
        startDate: daysFromToday(-45),
        endDate: daysFromToday(15),
      },
    },
    {
      docId: 'wo-4',
      docType: 'workOrder',
      data: {
        name: 'Compleks Systems',
        workCenterId: 'wc-3',
        status: 'in-progress',
        startDate: daysFromToday(25),
        endDate: daysFromToday(75),
      },
    },
    {
      docId: 'wo-5',
      docType: 'workOrder',
      data: {
        name: 'McMarrow Distribution',
        workCenterId: 'wc-4',
        status: 'blocked',
        startDate: daysFromToday(5),
        endDate: daysFromToday(40),
      },
    },
    {
      docId: 'wo-6',
      docType: 'workOrder',
      data: {
        name: 'Spartan Run A',
        workCenterId: 'wc-5',
        status: 'open',
        startDate: daysFromToday(50),
        endDate: daysFromToday(57),
      },
    },
    {
      docId: 'wo-7',
      docType: 'workOrder',
      data: {
        name: 'Genesis Batch',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: daysFromToday(30),
        endDate: daysFromToday(37),
      },
    },
    {
      docId: 'wo-8',
      docType: 'workOrder',
      data: {
        name: 'QC Lot 7',
        workCenterId: 'wc-4',
        status: 'complete',
        startDate: daysFromToday(-60),
        endDate: daysFromToday(-53),
      },
    },
  ];
}
