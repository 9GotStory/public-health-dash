import { KPIRecord } from '@/types/kpi';

/**
 * Calculate percentage from target and result values.
 * Blank results are treated as zero.
 * Returns null when both target and result are empty or zero,
 * or when target is zero/invalid to avoid division by zero.
 */
export const calculatePercentage = (record: Pick<KPIRecord, 'เป้าหมาย' | 'ผลงาน'>): number | null => {
  const targetRaw = record['เป้าหมาย']?.toString().trim();
  const resultRaw = record['ผลงาน']?.toString().trim();

  if (
    (!targetRaw && !resultRaw) ||
    (targetRaw === '0' && resultRaw === '0')
  ) {
    return null;
  }

  const target = parseFloat(targetRaw);
  const result = resultRaw === '' ? 0 : parseFloat(resultRaw);

  if (isNaN(target) || target === 0 || isNaN(result)) {
    return null;
  }

  return (result / target) * 100;
};

// UI helper: map percentage to status color text class
export const getStatusColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-success';
  if (percentage >= 60) return 'text-warning';
  return 'text-destructive';
};

// UI helper: map percentage to progress bar classes
export const getProgressClass = (percentage: number): string => {
  if (percentage >= 80) return 'bg-success/20 [&>div]:bg-success';
  if (percentage >= 60) return 'bg-warning/20 [&>div]:bg-warning';
  return 'bg-destructive/20 [&>div]:bg-destructive';
};

// Status by threshold for badges or filtering
export const getThresholdStatus = (
  percentage: number | null,
  threshold: number
): 'passed' | 'near' | 'failed' => {
  if (percentage === null) return 'failed';
  if (percentage >= threshold) return 'passed';
  if (percentage >= threshold * 0.8) return 'near';
  return 'failed';
};

// Absolute status without per-KPI threshold (e.g., group/main averages)
export const getAbsoluteStatus = (
  percentage: number
): 'passed' | 'near' | 'failed' => {
  if (percentage >= 80) return 'passed';
  if (percentage >= 60) return 'near';
  return 'failed';
};
