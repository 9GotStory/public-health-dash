import { Card } from "@/components/ui/card";
import { TrendingUp, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { SummaryStats } from "@/types/kpi";

interface DashboardHeaderProps {
  stats: SummaryStats;
  // Optional: override average for the summary bar based on current view context
  contextAverage?: number;
  // Optional: override counts for the three KPI counters based on current view
  contextTotal?: number;
  contextPassed?: number;
  contextFailed?: number;
  // Optional: override label for the total counter card
  contextTotalLabel?: string;
}

export const DashboardHeader = ({ stats, contextAverage, contextTotal, contextPassed, contextFailed, contextTotalLabel }: DashboardHeaderProps) => {
  const effectiveTotal = typeof contextTotal === 'number' ? contextTotal : stats.totalKPIs;
  const effectivePassed = typeof contextPassed === 'number' ? contextPassed : stats.passedKPIs;
  const effectiveFailed = typeof contextFailed === 'number'
    ? contextFailed
    : (typeof contextTotal === 'number' && typeof contextPassed === 'number')
      ? Math.max(0, contextTotal - contextPassed)
      : stats.failedKPIs;
  const successRate = effectiveTotal > 0 ?
    Math.round((effectivePassed / effectiveTotal) * 100) : 0;
  const effectiveAverage =
    typeof contextAverage === 'number' ? contextAverage : stats.averagePercentage;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground p-6 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
          Dashboard ติดตามประเด็นขับเคลื่อนตัวชี้วัด
        </h1>
        <p className="text-base sm:text-lg opacity-90">
          คณะกรรมการประสานงานสาธารณสุขระดับอำเภอสอง
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary rounded-lg">
              <Target className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{contextTotalLabel ?? 'ตัวชี้วัดทั้งหมด'}</p>
              <p className="text-2xl font-bold text-primary">{effectiveTotal}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ผ่านเกณฑ์</p>
              <p className="text-2xl font-bold text-success">{effectivePassed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-destructive rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ไม่ผ่านเกณฑ์</p>
              <p className="text-2xl font-bold text-destructive">{effectiveFailed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-warning rounded-lg">
              <TrendingUp className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">อัตราความสำเร็จ</p>
              <p className="text-2xl font-bold text-warning">{successRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ภาพรวมผลการดำเนินงาน</h3>
          <div className="text-sm text-muted-foreground">
            ค่าเฉลี่ย: {effectiveAverage.toFixed(2)}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-success to-success h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(effectiveAverage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </Card>
    </div>
  );
};
