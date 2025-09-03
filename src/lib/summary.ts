import { KPIRecord, SummaryStats } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";

export const calculateSummary = (data: KPIRecord[]): SummaryStats => {
  const stats: SummaryStats = {
    totalKPIs: 0,
    averagePercentage: 0,
    passedKPIs: 0,
    failedKPIs: 0,
    groupStats: {},
  };

  const kpiMap: Record<string, {
    group: string;
    threshold: number;
    percentages: number[];
  }> = {};

  data.forEach(item => {
    const percentage = calculatePercentage(item);
    if (percentage === null) return;

    const key = item.kpi_info_id ||
      `${item['ตัวชี้วัดหลัก']}|${item['ตัวชี้วัดย่อย']}|${item['กลุ่มเป้าหมาย']}`;

    if (!kpiMap[key]) {
      kpiMap[key] = {
        group: item['ประเด็นขับเคลื่อน'],
        threshold: parseFloat(item['เกณฑ์ผ่าน (%)']?.toString() || '0'),
        percentages: [],
      };
    }

    kpiMap[key].percentages.push(percentage);
  });

  Object.values(kpiMap).forEach(({ group, threshold, percentages }) => {
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const passed = average >= threshold;

    stats.totalKPIs++;
    stats.averagePercentage += average;
    if (passed) stats.passedKPIs++; else stats.failedKPIs++;

    if (!stats.groupStats[group]) {
      stats.groupStats[group] = {
        count: 0,
        totalPercentage: 0,
        passed: 0,
        failed: 0,
        averagePercentage: 0,
      };
    }
    const g = stats.groupStats[group];
    g.count++;
    g.totalPercentage += average;
    if (passed) g.passed++; else g.failed++;
  });

  Object.values(stats.groupStats).forEach(g => {
    g.averagePercentage = g.count > 0 ? g.totalPercentage / g.count : 0;
  });

  stats.averagePercentage = stats.totalKPIs > 0
    ? stats.averagePercentage / stats.totalKPIs
    : 0;

  return stats;
};

// Group overview focused on equal-weight averaging by "ตัวชี้วัดหลัก"
// For each group: average across its main KPIs (each main KPI averaged across its sub KPIs).
// Rows with blank ผลงาน are ignored in sub-KPI averaging; rows with invalid targets are skipped by calculatePercentage.
export const calculateGroupOverviewByMain = (
  data: KPIRecord[]
): { groupStats: Record<string, { averagePercentage: number; totalMain: number; passedMain: number }> } => {
  const byGroup: Record<string, Record<string, Record<string, KPIRecord[]>>> = {};

  data.forEach((item) => {
    const group = item['ประเด็นขับเคลื่อน']?.toString().trim();
    const main = item['ตัวชี้วัดหลัก']?.toString().trim();
    const sub = item['ตัวชี้วัดย่อย']?.toString().trim();
    if (!group || !main) return;
    if (!byGroup[group]) byGroup[group] = {} as Record<string, Record<string, KPIRecord[]>>;
    if (!byGroup[group][main]) byGroup[group][main] = {} as Record<string, KPIRecord[]>;
    const keySub = sub ?? '';
    if (!byGroup[group][main][keySub]) byGroup[group][main][keySub] = [] as KPIRecord[];
    byGroup[group][main][keySub].push(item);
  });

  const result: { groupStats: Record<string, { averagePercentage: number; totalMain: number; passedMain: number }> } = {
    groupStats: {},
  };

  Object.entries(byGroup).forEach(([group, mainMap]) => {
    const mainAverages: number[] = [];
    const mainPassFlags: boolean[] = [];

    Object.values(mainMap).forEach((subMap) => {
      const subAverages: number[] = [];
      const subPassFlags: boolean[] = [];
      const subThresholds: number[] = [];

      Object.values(subMap).forEach((recs) => {
        const vals: number[] = [];
        recs.forEach((r) => {
          const p = calculatePercentage(r);
          const hasResult = r['ผลงาน']?.toString().trim() !== '';
          if (p !== null && hasResult) vals.push(p);
        });
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const th = parseFloat(recs[0]['เกณฑ์ผ่าน (%)']?.toString() || '0');
        const normTh = isNaN(th) ? 0 : th;
        subAverages.push(avg);
        subThresholds.push(normTh);
        subPassFlags.push(avg >= normTh);
      });

      const mainAvg = subAverages.length > 0 ? subAverages.reduce((a, b) => a + b, 0) / subAverages.length : 0;
      const mainPassed = subPassFlags.length > 0 ? subPassFlags.every(Boolean) : false;
      mainAverages.push(mainAvg);
      mainPassFlags.push(mainPassed);
    });

    const totalMain = mainAverages.length;
    const avgGroup = totalMain > 0 ? mainAverages.reduce((a, b) => a + b, 0) / totalMain : 0;
    const passedMain = mainPassFlags.filter(Boolean).length;
    result.groupStats[group] = { averagePercentage: avgGroup, totalMain, passedMain };
  });

  return result;
};
