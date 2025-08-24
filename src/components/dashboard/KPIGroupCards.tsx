import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Activity, Target, TrendingUp, Users } from "lucide-react";
import { KPIRecord, SummaryStats } from "@/types/kpi";

interface KPIGroupCardsProps {
  data: KPIRecord[];
  summary: SummaryStats;
  onGroupClick: (groupName: string) => void;
}

export const KPIGroupCards = ({ data, summary, onGroupClick }: KPIGroupCardsProps) => {
  // Group data by "ประเด็นขับเคลื่อน"
  const groupedData = data.reduce((acc, item) => {
    const group = item['ประเด็นขับเคลื่อน'];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, KPIRecord[]>);

  const getGroupIcon = (groupName: string) => {
    if (groupName.includes('สุขภาพจิต') || groupName.includes('ยาเสพติด')) {
      return <Users className="h-6 w-6" />;
    }
    if (groupName.includes('มะเร็ง')) {
      return <Activity className="h-6 w-6" />;
    }
    return <Target className="h-6 w-6" />;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">ประเด็นขับเคลื่อนหลัก</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedData).map(([groupName, records]) => {
          const groupStats = summary.groupStats[groupName];
          const averagePercentage = groupStats?.averagePercentage || 0;
          const passedCount = groupStats?.passed || 0;
          const totalCount = groupStats?.count || records.length;
          
          return (
            <Card 
              key={groupName} 
              className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary"
              onClick={() => onGroupClick(groupName)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getGroupIcon(groupName)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                      {groupName}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="space-y-4">
                {/* Stats Row */}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">ตัวชี้วัด:</span>
                    <span className="font-medium">{totalCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">ผ่าน:</span>
                    <span className={`font-medium ${getStatusColor(averagePercentage)}`}>
                      {passedCount}/{totalCount}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ความสำเร็จเฉลี่ย</span>
                    <span className={`text-lg font-bold ${getStatusColor(averagePercentage)}`}>
                      {averagePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(averagePercentage, 100)} 
                    className="h-2"
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