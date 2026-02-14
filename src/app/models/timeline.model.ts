export type TimelineZoom = 'day' | 'week' | 'month';

export interface TimelineRange {
  start: Date;
  end: Date;
  /** Total duration in ms */
  durationMs: number;
}
