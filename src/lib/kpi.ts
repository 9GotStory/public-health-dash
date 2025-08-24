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
