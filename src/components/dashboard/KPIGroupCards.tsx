import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import {
  ChevronRight,
  Brain,
  Pill,
  Ribbon,
  Activity,
  HeartPulse,
  Shield,
  Star,
  Users,
  Leaf,
  Flame,
  Droplet,
  Sun,
  Moon,
  Book,
  Cloud,
  Compass,
  Anchor,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KPIRecord, SummaryStats } from "@/types/kpi";
import { getStatusColorByThreshold, getProgressClassByThreshold, calculatePercentage } from "@/lib/kpi";
import { formatPercentage } from "@/lib/format";
import { getStr, getNum } from "@/lib/data";
import { F } from "@/lib/fields";

interface KPIGroupCardsProps {
  data: KPIRecord[];
  stats: SummaryStats;
  onGroupClick: (groupName: string, icon: LucideIcon) => void;
}

export const KPIGroupCards = ({ data, stats, onGroupClick }: KPIGroupCardsProps) => {
  // Group data by "ประเด็นขับเคลื่อน"
  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      const group = item['ประเด็นขับเคลื่อน'];
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, KPIRecord[]>);
  }, [data]);

  const fallbackIcons: LucideIcon[] = [
    Activity,
    HeartPulse,
    Shield,
    Star,
    Users,
    Leaf,
    Flame,
    Droplet,
    Sun,
    Moon,
    Book,
    Cloud,
    Compass,
    Anchor,
    Zap,
  ];

  const iconMap = useMemo(() => new Map<string, LucideIcon>(), []);

  const getGroupIcon = (groupName: string): LucideIcon => {
    if (groupName.includes('สุขภาพจิต')) {
      return Brain;
    }
    if (groupName.includes('ยาเสพติด')) {
      return Pill;
    }
    if (groupName.includes('มะเร็ง')) {
      return Ribbon;
    }
    if (!iconMap.has(groupName)) {
      const Icon = fallbackIcons[iconMap.size % fallbackIcons.length];
      iconMap.set(groupName, Icon);
    }
    return iconMap.get(groupName)!;
  };

  

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground break-words">
        ประเด็นขับเคลื่อนหลัก
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedData).map(([groupName, records]) => {
          // Compute group-level stats consistent with the Main view
          // totalCount: number of unique main KPIs in this group
          // passedCount: number of main KPIs where all sub-KPIs pass their thresholds
          // averagePercentage: average of per-main averages (each main's avg is the average of its sub-KPIs' first-row percentages)
          const byMain: Record<string, Record<string, KPIRecord[]>> = records.reduce((m, item) => {
            const main = getStr(item, F.MAIN);
            const sub = getStr(item, F.SUB);
            if (!m[main]) m[main] = {} as Record<string, KPIRecord[]>;
            if (!m[main][sub]) m[main][sub] = [];
            m[main][sub].push(item);
            return m;
          }, {} as Record<string, Record<string, KPIRecord[]>>);

          // Compute per-main averages and pass flags using first-row percentage per sub-KPI
          const perMainAverages: number[] = [];
          const perMainThresholds: number[] = [];
          const mainPassFlags: boolean[] = [];
          Object.values(byMain).forEach(subMap => {
            const subAverages: number[] = [];
            const subThresholds: number[] = [];
            let subAllPass = true;
            Object.values(subMap).forEach(recs => {
              const vals: number[] = [];
              recs.forEach(r => {
                const p = calculatePercentage(r);
                const hasResult = getStr(r, F.RESULT) !== '';
                if (p !== null && hasResult) vals.push(p);
              });
              const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
              const th = getNum(recs[0], F.THRESHOLD) || 0;
              if (avg < th) subAllPass = false;
              subAverages.push(avg);
              subThresholds.push(isNaN(th) ? 0 : th);
            });
            const avgMain = subAverages.length > 0 ? subAverages.reduce((a, b) => a + b, 0) / subAverages.length : 0;
            const thMain = subThresholds.length > 0 ? subThresholds.reduce((a, b) => a + b, 0) / subThresholds.length : 0;
            perMainAverages.push(avgMain);
            perMainThresholds.push(thMain);
            mainPassFlags.push(subAllPass);
          });

          const totalCount = Object.keys(byMain).length;
          const averagePercentage = perMainAverages.length > 0 ? perMainAverages.reduce((a, b) => a + b, 0) / perMainAverages.length : 0;
          const averageThreshold = perMainThresholds.length > 0 ? perMainThresholds.reduce((a, b) => a + b, 0) / perMainThresholds.length : 0;
          const passedCount = mainPassFlags.filter(Boolean).length;
          const GroupIcon = getGroupIcon(groupName);

          return (
            <Card
              key={groupName}
              className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary"
              onClick={() => onGroupClick(groupName, GroupIcon)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                    <GroupIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors break-words">
                      {groupName}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>

              <div className="space-y-4">
                {/* Stats Row */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">ตัวชี้วัดหลัก:</span>
                    <span className="font-medium">{totalCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">ผ่าน:</span>
                    <span className={`font-medium ${getStatusColorByThreshold(averagePercentage, averageThreshold)}`}>
                      {passedCount}/{totalCount}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ร้อยละเฉลี่ย</span>
                    <span className={`text-lg font-bold ${getStatusColorByThreshold(averagePercentage, averageThreshold)}`}>
                      {formatPercentage(averagePercentage)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(averagePercentage, 100)}
                    className={`h-2 ${getProgressClassByThreshold(averagePercentage, averageThreshold)}`}
                  />
                </div>

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  ดูรายละเอียด
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">ไม่พบข้อมูลตัวชี้วัดที่ตรงกับเงื่อนไขการค้นหา</p>
            <p className="text-sm mt-2">กรุณาลองปรับเปลี่ยนตัวกรองหรือล้างการค้นหา</p>
          </div>
        </Card>
      )}
    </div>
  );
};
