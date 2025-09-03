import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import { ChevronLeft, ChevronRight, Flag, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getStatusColor, getProgressClass } from "@/lib/kpi";

interface TargetCardsProps {
  data: KPIRecord[];
  groupName: string;
  mainKPIName: string;
  subKPIName: string;
  groupIcon?: LucideIcon;
  onBack: () => void;
  onTargetClick: (target: string) => void;
  onNavigateToGroups?: () => void;
  onNavigateToMain?: () => void;
  onNavigateToSub?: () => void;
}

export const TargetCards = ({ data, groupName, mainKPIName, subKPIName, groupIcon: GroupIcon, onBack, onTargetClick, onNavigateToGroups, onNavigateToMain, onNavigateToSub }: TargetCardsProps) => {
  const stats = useMemo(() => {
    const grouped = data.reduce((m, item) => {
      const target = item['กลุ่มเป้าหมาย'];
      if (!m[target]) m[target] = [] as KPIRecord[];
      m[target].push(item);
      return m;
    }, {} as Record<string, KPIRecord[]>);

    const acc: Record<string, { avg: number; count: number }> = {};
    Object.entries(grouped).forEach(([target, records]) => {
      const vals: number[] = [];
      records.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = r['ผลงาน']?.toString().trim() !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      acc[target] = { avg, count: records.length };
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
              <h2 className="text-xl sm:text-2xl font-bold break-words">กลุ่มเป้าหมาย</h2>
              <nav aria-label="Breadcrumb" className="text-sm mt-1">
                <div className="flex items-center text-muted-foreground flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={onNavigateToGroups ?? onNavigateToMain ?? onBack}
                    className="text-primary hover:underline"
                    title="ไปที่ประเด็นขับเคลื่อนหลัก"
                  >
                    {groupName}
                  </button>
                  <span className="mx-1">/</span>
                  <button
                    type="button"
                    onClick={onNavigateToMain ?? onBack}
                    className="text-primary hover:underline"
                    title="ไปที่ตัวชี้วัดหลัก"
                  >
                    ตัวชี้วัดหลัก: {mainKPIName}
                  </button>
                  {subKPIName && <span className="mx-1">/</span>}
                  {subKPIName && (
                    onNavigateToSub ? (
                      <button
                        type="button"
                        onClick={onNavigateToSub}
                        className="text-primary hover:underline"
                        title="ไปที่ตัวชี้วัดย่อย"
                      >
                        ตัวชี้วัดย่อย: {subKPIName}
                      </button>
                    ) : (
                      <span className="text-foreground">ตัวชี้วัดย่อย: {subKPIName}</span>
                    )
                  )}
                  <span className="mx-1">/</span>
                  <span className="text-foreground">กลุ่มเป้าหมาย</span>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(stats).map(([target, s]) => (
          <Card
            key={target}
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary"
            onClick={() => onTargetClick(target)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <Flag className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors break-words flex-1 min-w-0">
                  {target}
                </h3>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">หน่วยบริการ:</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ร้อยละ</span>
                  <span className={`text-lg font-bold ${getStatusColor(s.avg)}`}>{s.avg.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(s.avg, 100)} className={`h-2 ${getProgressClass(s.avg)}`} />
              </div>

              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" /> ดูรายละเอียด
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
