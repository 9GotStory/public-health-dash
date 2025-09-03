import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import { formatPercentage } from "@/lib/format";
import { getStr, getNum } from "@/lib/data";
import { F } from "@/lib/fields";
import { ChevronLeft, ChevronRight, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getStatusColorByThreshold, getProgressClassByThreshold } from "@/lib/kpi";
import { ContextPath } from "./ContextPath";

interface MainKPICardsProps {
  data: KPIRecord[];
  groupName: string;
  groupIcon?: LucideIcon;
  onBack: () => void;
  onMainKPIClick: (mainKPI: string) => void;
}

export const MainKPICards = ({ data, groupName, groupIcon: GroupIcon, onBack, onMainKPIClick }: MainKPICardsProps) => {
  // Group by main KPI then by sub KPI to compute rollups similar to detail table
  const mainStats = useMemo(() => {
    const acc: Record<string, {
      subCount: number;
      passed: number;
      avg: number;
      threshold: number;
    }> = {};

    const perMain: Record<string, { sums: number; count: number; passed: number; thSums: number; thCount: number }>
      = {};

    // Build percentages per sub KPI within a main KPI
    const grouped = data.reduce((m, item) => {
      const main = getStr(item, F.MAIN);
      const sub = getStr(item, F.SUB);
      if (!m[main]) m[main] = {} as Record<string, KPIRecord[]>;
      if (!m[main][sub]) m[main][sub] = [];
      m[main][sub].push(item);
      return m;
    }, {} as Record<string, Record<string, KPIRecord[]>>);

    Object.entries(grouped).forEach(([main, subMap]) => {
      let sums = 0;
      let count = 0;
      let passed = 0;
      let thSums = 0;
      let thCount = 0;
      Object.values(subMap).forEach(records => {
        // Average across all rows with valid results for this sub-KPI
        const vals: number[] = [];
        records.forEach(r => {
          const p = calculatePercentage(r);
          const hasResult = getStr(r, F.RESULT) !== '';
          if (p !== null && hasResult) vals.push(p);
        });
        const subAvg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const th = getNum(records[0], F.THRESHOLD) || 0;
        if (subAvg >= th) passed++;
        sums += subAvg;
        count++;
        if (!isNaN(th)) { thSums += th; thCount++; }
      });
      perMain[main] = { sums, count, passed, thSums, thCount };
    });

    Object.entries(perMain).forEach(([main, { sums, count, passed, thSums, thCount }]) => {
      acc[main] = {
        subCount: count,
        passed,
        avg: count > 0 ? sums / count : 0,
        threshold: thCount > 0 ? thSums / thCount : 0,
      };
    });

    return acc;
  }, [data]);

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" /> กลับ
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            {GroupIcon && (
              <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                <GroupIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold break-words">ตัวชี้วัดหลัก</h2>
            </div>
          </div>
        </div>

      </div>

      <ContextPath groupName={groupName} mainLabelOnly />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(mainStats).map(([main, s]) => (
          <Card
            key={main}
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary"
            onClick={() => onMainKPIClick(main)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors break-words flex-1 min-w-0">
                  {main}
                </h3>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">ตัวชี้วัดย่อย:</span>
                  <span className="font-medium">{s.subCount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">ผ่าน:</span>
                  <span className={`font-medium ${getStatusColorByThreshold(s.avg, s.threshold)}`}>{s.passed}/{s.subCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ร้อยละเฉลี่ย</span>
                  <span className={`text-lg font-bold ${getStatusColorByThreshold(s.avg, s.threshold)}`}>{formatPercentage(s.avg)}</span>
                </div>
                <Progress value={Math.min(s.avg, 100)} className={`h-2 ${getProgressClassByThreshold(s.avg, s.threshold)}`} />
              </div>

              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" /> ดูรายละเอียด
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(mainStats).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">ไม่พบตัวชี้วัดหลักในประเด็นนี้</p>
          </div>
        </Card>
      )}
    </div>
  );
};
