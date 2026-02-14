import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../services/schedule.service';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument } from '../../models/work-order.model';
import { WorkOrderStatus } from '../../models/work-order.model';
import { TimelineZoom } from '../../models/timeline.model';
import { WorkOrderPanelComponent, PanelMode } from '../work-order-panel/work-order-panel.component';

const ROW_HEIGHT_PX = 48;
const HEADER_HEIGHT_PX = 44;
const LEFT_PANEL_WIDTH_PX = 220;
const TIMELINE_BODY_WIDTH = 3600; // total px width of the scrollable area

/** Buffer: ±2 weeks day, ±2 months week, ±6 months month */
function getRangeForZoom(zoom: TimelineZoom): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  switch (zoom) {
    case 'day':
      start.setDate(start.getDate() - 14);
      end.setDate(end.getDate() + 14);
      break;
    case 'week':
      start.setMonth(start.getMonth() - 2);
      end.setMonth(end.getMonth() + 2);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 6);
      end.setMonth(end.getMonth() + 6);
      break;
  }
  return { start, end };
}

function getTimelineStart(r: { start: Date }): number {
  return r.start.getTime();
}

function getTimelineDuration(r: { start: Date; end: Date }): number {
  return r.end.getTime() - r.start.getTime();
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkOrderPanelComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('timelineBody') timelineBodyRef!: ElementRef<HTMLDivElement>;

  readonly ROW_HEIGHT = ROW_HEIGHT_PX;
  readonly HEADER_HEIGHT = HEADER_HEIGHT_PX;
  readonly LEFT_PANEL_WIDTH = LEFT_PANEL_WIDTH_PX;

  workCenters: WorkCenterDocument[] = [];
  workOrders: WorkOrderDocument[] = [];
  zoom: TimelineZoom = 'day';
  zoomOptions: { value: TimelineZoom; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  panelOpen = false;
  panelMode: PanelMode = 'create';
  panelOverlapError: string | null = null;
  createPrefill: { startDate: string; endDate: string; workCenterId: string } | null = null;
  editOrder: WorkOrderDocument | null = null;

  range = getRangeForZoom('day');
  timelineStart = getTimelineStart(this.range);
  timelineDuration = getTimelineDuration(this.range);
  headerLabels: { label: string; leftPx: number; widthPx: number }[] = [];
  todayPositionPx: number | null = null;

  hoveredRowId: string | null = null;
  openMenuDocId: string | null = null;

  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private schedule: ScheduleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.workCenters = this.schedule.getWorkCenters();
    this.syncOrders();
    this.updateRange();
  }

  ngAfterViewInit(): void {
    this.updateHeaderLabels();
    this.cdr.detectChanges();
    const el = this.timelineBodyRef?.nativeElement;
    if (el) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateHeaderLabels();
        this.cdr.detectChanges();
      });
      this.resizeObserver.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private syncOrders(): void {
    this.workOrders = this.schedule.getWorkOrders();
  }

  setZoom(z: TimelineZoom): void {
    this.zoom = z;
    this.range = getRangeForZoom(z);
    this.timelineStart = getTimelineStart(this.range);
    this.timelineDuration = getTimelineDuration(this.range);
    this.updateHeaderLabels();
    this.cdr.detectChanges();
  }

  private updateRange(): void {
    this.timelineStart = getTimelineStart(this.range);
    this.timelineDuration = getTimelineDuration(this.range);
    this.updateHeaderLabels();
  }

  private updateHeaderLabels(): void {
    const el = this.timelineBodyRef?.nativeElement;
    const width = el?.offsetWidth ?? TIMELINE_BODY_WIDTH;
    const labels: { label: string; leftPx: number; widthPx: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    if (this.zoom === 'day') {
      const dayMs = 24 * 60 * 60 * 1000;
      const startDay = Math.floor(this.range.start.getTime() / dayMs) * dayMs;
      const endDay = this.range.end.getTime();
      const totalDays = Math.ceil((endDay - startDay) / dayMs);
      const colWidth = width / totalDays;
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDay + i * dayMs);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push({ label, leftPx: i * colWidth, widthPx: colWidth });
      }
      if (todayTime >= this.range.start.getTime() && todayTime <= this.range.end.getTime()) {
        this.todayPositionPx = ((todayTime - this.range.start.getTime()) / this.timelineDuration) * width;
      } else {
        this.todayPositionPx = null;
      }
    } else if (this.zoom === 'week') {
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const startWeek = new Date(this.range.start);
      startWeek.setDate(startWeek.getDate() - startWeek.getDay());
      const startWeekTime = startWeek.getTime();
      const endTime = this.range.end.getTime();
      const totalWeeks = Math.ceil((endTime - startWeekTime) / weekMs) || 1;
      const colWidth = width / totalWeeks;
      for (let i = 0; i < totalWeeks; i++) {
        const wStart = new Date(startWeekTime + i * weekMs);
        const label = `W${Math.ceil(wStart.getDate() / 7)} ${wStart.toLocaleDateString('en-US', { month: 'short' })}`;
        labels.push({ label, leftPx: i * colWidth, widthPx: colWidth });
      }
      this.todayPositionPx =
        todayTime >= this.range.start.getTime() && todayTime <= this.range.end.getTime()
          ? ((todayTime - this.range.start.getTime()) / this.timelineDuration) * width
          : null;
    } else {
      const monthMs = 30.44 * 24 * 60 * 60 * 1000;
      const totalMonths =
        (this.range.end.getFullYear() - this.range.start.getFullYear()) * 12 +
        (this.range.end.getMonth() - this.range.start.getMonth()) +
        1;
      const colWidth = width / totalMonths;
      for (let i = 0; i < totalMonths; i++) {
        const d = new Date(this.range.start.getFullYear(), this.range.start.getMonth() + i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        labels.push({ label, leftPx: i * colWidth, widthPx: colWidth });
      }
      this.todayPositionPx =
        todayTime >= this.range.start.getTime() && todayTime <= this.range.end.getTime()
          ? ((todayTime - this.range.start.getTime()) / this.timelineDuration) * width
          : null;
    }
    this.headerLabels = labels;
  }

  /** Convert date range to left % and width % of timeline body (0..100). */
  barPosition(startDate: string, endDate: string): { leftPct: number; widthPct: number } {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const leftPct = Math.max(0, ((start - this.timelineStart) / this.timelineDuration) * 100);
    const widthPct = Math.min(100 - leftPct, ((end - start) / this.timelineDuration) * 100);
    return { leftPct, widthPct: Math.max(0, widthPct) };
  }

  statusClass(status: WorkOrderStatus): string {
    return `status-${status}`;
  }

  statusLabel(status: WorkOrderStatus): string {
    const map: Record<WorkOrderStatus, string> = {
      open: 'Open',
      'in-progress': 'In Progress',
      complete: 'Complete',
      blocked: 'Blocked',
    };
    return map[status];
  }

  ordersForCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrders.filter((o) => o.data.workCenterId === workCenterId);
  }

  /** True if this work center row contains the order whose three-dot menu is open. */
  rowHasMenuOpen(workCenterId: string): boolean {
    if (!this.openMenuDocId) return false;
    const order = this.workOrders.find((o) => o.docId === this.openMenuDocId);
    return order?.data.workCenterId === workCenterId;
  }

  onTimelineClick(workCenterId: string, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.work-order-bar') || target.closest('.bar-actions')) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const t = this.timelineStart + (x / width) * this.timelineDuration;
    const clickDate = new Date(t);
    const startStr = clickDate.toISOString().slice(0, 10);
    const endDate = new Date(clickDate);
    endDate.setDate(endDate.getDate() + 7);
    const endStr = endDate.toISOString().slice(0, 10);
    this.createPrefill = { startDate: startStr, endDate: endStr, workCenterId };
    this.panelMode = 'create';
    this.panelOverlapError = null;
    this.editOrder = null;
    this.panelOpen = true;
    this.cdr.detectChanges();
  }

  openEdit(order: WorkOrderDocument): void {
    this.editOrder = order;
    this.panelMode = 'edit';
    this.panelOverlapError = null;
    this.createPrefill = null;
    this.panelOpen = true;
    this.openMenuDocId = null;
    this.cdr.detectChanges();
  }

  deleteOrder(order: WorkOrderDocument): void {
    this.schedule.deleteWorkOrder(order.docId);
    this.syncOrders();
    this.openMenuDocId = null;
    this.cdr.detectChanges();
  }

  closePanel(): void {
    this.panelOpen = false;
    this.panelOverlapError = null;
    this.createPrefill = null;
    this.editOrder = null;
    this.cdr.detectChanges();
  }

  onCreate(payload: Partial<WorkOrderDocument['data']> & { workCenterId: string }): void {
    const overlap = this.schedule.hasOverlap(
      payload.workCenterId,
      payload.startDate!,
      payload.endDate!
    );
    if (overlap) {
      this.panelOverlapError = 'This work order overlaps with an existing order on the same work center.';
      this.cdr.detectChanges();
      return;
    }
    const docId = 'wo-' + Date.now();
    this.schedule.addWorkOrder({
      docId,
      docType: 'workOrder',
      data: {
        name: payload.name!,
        workCenterId: payload.workCenterId,
        status: payload.status ?? 'open',
        startDate: payload.startDate!,
        endDate: payload.endDate!,
      },
    });
    this.syncOrders();
    this.closePanel();
  }

  onSave(event: { docId: string; data: WorkOrderDocument['data'] }): void {
    const overlap = this.schedule.hasOverlap(
      event.data.workCenterId,
      event.data.startDate,
      event.data.endDate,
      event.docId
    );
    if (overlap) {
      this.panelOverlapError = 'This work order overlaps with an existing order on the same work center.';
      this.cdr.detectChanges();
      return;
    }
    this.schedule.updateWorkOrder(event.docId, event.data);
    this.syncOrders();
    this.closePanel();
  }

  toggleMenu(docId: string): void {
    this.openMenuDocId = this.openMenuDocId === docId ? null : docId;
    this.cdr.detectChanges();
  }

  setHoverRow(id: string | null): void {
    this.hoveredRowId = id;
    this.cdr.detectChanges();
  }

  get timelineBodyHeightPx(): number {
    return this.HEADER_HEIGHT + this.workCenters.length * this.ROW_HEIGHT;
  }

  /** Label for current period indicator in header (matches screenshots). */
  get currentPeriodLabel(): string {
    switch (this.zoom) {
      case 'day': return 'Current day';
      case 'week': return 'Current week';
      case 'month': return 'Current month';
      default: return 'Current day';
    }
  }
}
