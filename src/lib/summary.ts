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

