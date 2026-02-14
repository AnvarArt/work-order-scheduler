import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderDocument } from '../../models/work-order.model';
import { WorkOrderStatus } from '../../models/work-order.model';
import { WorkCenterDocument } from '../../models/work-center.model';

export type PanelMode = 'create' | 'edit';

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'blocked', label: 'Blocked' },
];

function isoToNgbDate(iso: string): NgbDateStruct {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function ngbDateToIso(n: NgbDateStruct): string {
  const m = String(n.month).padStart(2, '0');
  const d = String(n.day).padStart(2, '0');
  return `${n.year}-${m}-${d}`;
}

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
  ],
  templateUrl: './work-order-panel.component.html',
  styleUrl: './work-order-panel.component.scss',
})
export class WorkOrderPanelComponent {
  @Input() mode: PanelMode = 'create';
  @Input() workCenters: WorkCenterDocument[] = [];
  @Input() initialWorkCenterId: string | null = null;
  /** When opening in create mode, prefill start/end from click. */
  @Input() set createPrefill(prefill: { startDate: string; endDate: string; workCenterId: string } | null) {
    if (!prefill || this.mode !== 'create') return;
    this.form.patchValue({
      workCenterId: prefill.workCenterId,
      startDate: isoToNgbDate(prefill.startDate),
      endDate: isoToNgbDate(prefill.endDate),
    });
  }
  @Input() overlapError: string | null = null;
  @Input() set prefill(order: WorkOrderDocument | null) {
    if (!order) {
      this.resetForm();
      return;
    }
    const d = order.data;
    this.form.patchValue({
      name: d.name,
      status: d.status,
      startDate: isoToNgbDate(d.startDate),
      endDate: isoToNgbDate(d.endDate),
    });
    this.form.get('workCenterId')?.setValue(d.workCenterId);
    this.editingDocId = order.docId;
  }

  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<Partial<WorkOrderDocument['data']> & { workCenterId: string }>();
  @Output() save = new EventEmitter<{ docId: string; data: WorkOrderDocument['data'] }>();

  readonly statusOptions = STATUS_OPTIONS;
  editingDocId: string | null = null;

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    workCenterId: new FormControl<string>('', [Validators.required]),
    status: new FormControl<WorkOrderStatus>('open', [Validators.required]),
    startDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
    endDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
  });

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Save' : 'Create';
  }

  get endDateBeforeStartError(): boolean {
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;
    if (!start || !end) return false;
    const s = new Date(start.year, start.month - 1, start.day).getTime();
    const e = new Date(end.year, end.month - 1, end.day).getTime();
    return e < s;
  }

  /** When start date changes in create mode, set end to start + 7 days if end is empty or before start. */
  onStartDateSelect(date: NgbDateStruct | null): void {
    if (this.mode !== 'create' || !date) return;
    const end = this.form.get('endDate')?.value;
    const startTime = new Date(date.year, date.month - 1, date.day).getTime();
    const plus7 = new Date(startTime);
    plus7.setDate(plus7.getDate() + 7);
    const endStruct: NgbDateStruct = {
      year: plus7.getFullYear(),
      month: plus7.getMonth() + 1,
      day: plus7.getDate(),
    };
    if (!end || new Date(end.year, end.month - 1, end.day).getTime() < startTime) {
      this.form.get('endDate')?.setValue(endStruct);
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.endDateBeforeStartError) return;

    const name = this.form.get('name')?.value ?? '';
    const workCenterId = this.form.get('workCenterId')?.value ?? '';
    const status = this.form.get('status')?.value ?? 'open';
    const startDate = this.form.get('startDate')?.value;
    const endDate = this.form.get('endDate')?.value;
    if (!startDate || !endDate) return;

    const startIso = ngbDateToIso(startDate);
    const endIso = ngbDateToIso(endDate);

    if (this.isEditMode && this.editingDocId) {
      this.save.emit({
        docId: this.editingDocId,
        data: { name, workCenterId, status, startDate: startIso, endDate: endIso },
      });
    } else {
      this.create.emit({
        name,
        workCenterId,
        status,
        startDate: startIso,
        endDate: endIso,
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  private resetForm(): void {
    this.editingDocId = null;
    this.form.reset({
      name: '',
      workCenterId: this.initialWorkCenterId ?? '',
      status: 'open',
      startDate: null,
      endDate: null,
    });
  }
}
