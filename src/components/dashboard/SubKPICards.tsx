import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import { ChevronLeft, ChevronRight, ListChecks, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getStatusColorByThreshold, getProgressClassByThreshold } from "@/lib/kpi";
import { ContextPath } from "./ContextPath";
import React, { Suspense } from 'react';
const SubKPIBarChartLazy = React.lazy(() => import('./charts/SubKPIBarChart').then(m => ({ default: m.SubKPIBarChart })));
import { formatPercentage } from "@/lib/format";
import { getStr, getNum } from "@/lib/data";
import { F } from "@/lib/fields";

interface SubKPICardsProps {
  data: KPIRecord[];
  groupName: string;
  mainKPIName: string;
  groupIcon?: LucideIcon;
  onBack: () => void;
  onSubKPIClick: (subKPI: string) => void;
  onNavigateToGroups?: () => void;
}

export const SubKPICards = ({ data, groupName, mainKPIName, groupIcon: GroupIcon, onBack, onSubKPIClick, onNavigateToGroups }: SubKPICardsProps) => {
  const subStats = useMemo(() => {
    const acc: Record<string, { avg: number; threshold: number }> = {};
    const grouped = data.reduce((m, item) => {
      const sub = getStr(item, F.SUB);
      if (!m[sub]) m[sub] = [] as KPIRecord[];
      m[sub].push(item);
      return m;
    }, {} as Record<string, KPIRecord[]>);

    Object.entries(grouped).forEach(([sub, records]) => {
      // Average across all rows with valid results under this sub-KPI
      const vals: number[] = [];
      records.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = getStr(r, F.RESULT) !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const th = getNum(records[0], F.THRESHOLD) || 0;
      acc[sub] = { avg, threshold: th };
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
              <h2 className="text-xl sm:text-2xl font-bold break-words">ตัวชี้วัดย่อย</h2>
            </div>
          </div>
        </div>

      </div>

      <ContextPath groupName={groupName} mainKPIName={mainKPIName} subLabelOnly />

      {/* Chart: compare sub KPIs within this main KPI */}
      {(() => {
        const items = Object.entries(subStats).map(([sub, s]) => ({ name: sub, avg: s.avg, threshold: s.threshold }));
        return items.length > 0 ? (
          <Suspense fallback={<div className="w-full h-72" />}>
            <SubKPIBarChartLazy data={items} />
          </Suspense>
        ) : null;
      })()}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(subStats).map(([sub, s]) => (
          <Card
            key={sub}
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary"
            onClick={() => onSubKPIClick(sub)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <ListChecks className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors break-words flex-1 min-w-0">
                  {sub}
                </h3>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ร้อยละเฉลี่ย</span>
                  <span className={`text-lg font-bold ${getStatusColorByThreshold(s.avg, s.threshold)}`}>{formatPercentage(s.avg)}</span>
                </div>
                <Progress value={Math.min(s.avg, 100)} className={`h-2 ${getProgressClassByThreshold(s.avg, s.threshold)}`} />
              </div>

              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" /> ดูข้อมูลหน่วยบริการ
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(subStats).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">ไม่พบตัวชี้วัดย่อยในตัวชี้วัดหลักนี้</p>
          </div>
        </Card>
      )}
    </div>
  );
};
