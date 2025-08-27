import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KPIRecord, SummaryStats } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import {  
  AlertCircle,
  ChevronLeft,
  Eye,
  Info,
  Table as TableIcon,
  Users,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const getStatusBadge = (percentage: number, threshold: number) => {
  if (percentage >= threshold) {
    return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
  } else if (percentage >= threshold * 0.8) {
    return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
  }
  return <Badge variant="destructive">ไม่ผ่าน</Badge>;
};

const formatNumber = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? value : num.toLocaleString();
};

const formatPercentage = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "" : `${num.toFixed(2)}%`;
};

const getStatusBadge = (percentage: number, threshold: number) => {
  if (percentage >= threshold) {
    return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
  } else if (percentage >= threshold * 0.8) {
    return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
  }
  return <Badge variant="destructive">ไม่ผ่าน</Badge>;
};

const formatNumber = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? value : num.toLocaleString();
};

const formatPercentage = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "" : `${num.toFixed(2)}%`;
};

const getStatusBadge = (percentage: number, threshold: number) => {
  if (percentage >= threshold) {
    return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
  } else if (percentage >= threshold * 0.8) {
    return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
  }
  return <Badge variant="destructive">ไม่ผ่าน</Badge>;
};

const formatNumber = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? value : num.toLocaleString();
};

const formatPercentage = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "" : `${num.toFixed(2)}%`;
};

interface KPIDetailTableProps {
  data: KPIRecord[];
  groupName?: string;
  groupIcon?: LucideIcon;
  summary?: SummaryStats;
  onBack?: () => void;
  onKPIInfoClick: (kpiInfoId: string) => void;
  onRawDataClick: (sheetSource: string, record?: KPIRecord) => void;
}

export const KPIDetailTable = ({
  data,
  groupName,
  onBack,
  onKPIInfoClick,
  onRawDataClick
}: KPIDetailTableProps) => {
  // Group by main KPI first, then by sub KPI
  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      const mainKPI = item['ตัวชี้วัดหลัก'];
      const subKPI = item['ตัวชี้วัดย่อย'];

      if (!acc[mainKPI]) acc[mainKPI] = {};
      if (!acc[mainKPI][subKPI]) acc[mainKPI][subKPI] = [];
      acc[mainKPI][subKPI].push(item);

      return acc;
    }, {} as Record<string, Record<string, KPIRecord[]>>);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              กลับ
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold break-words">รายละเอียดตัวชี้วัด</h2>
            {groupName && (
              <p className="text-sm text-muted-foreground break-words">{groupName}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          รวม {data.length} รายการ
        </div>
      </div>

      {groupName && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg leading-tight break-words flex-1">
              {groupName}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">ตัวชี้วัด:</span>
                <span className="font-medium">{totalKPIs}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">ผ่าน:</span>
                <span className={`font-medium ${getStatusColor(averagePercentage)}`}>
                  {passedCount}/{totalKPIs}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ความสำเร็จเฉลี่ย</span>
                <span className={`text-lg font-bold ${getStatusColor(averagePercentage)}`}>
                  {averagePercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(averagePercentage, 100)} className="h-2" />
            </div>
          </div>
        </Card>
      )}

      {/* Main KPI Groups */}
      <div className="space-y-8">
        {Object.entries(groupedData).map(([mainKPI, subKPIGroups]) => (
          <Card key={mainKPI} className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2 break-words">{mainKPI}</h3>
              <div className="h-1 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
            </div>

            {/* Sub KPI Groups */}
            <div className="space-y-6">
              {Object.entries(subKPIGroups).map(([subKPI, records]) => {
                const groupSheetSource =
                  records[0]?.sheet_source?.trim() ||
                  (records[0] as Record<string, string | undefined>)['แหล่งข้อมูล']?.trim();

                return (
                  <Card key={subKPI} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-secondary-foreground break-words">{subKPI}</h4>
                      <div className="flex space-x-2">
                        {groupSheetSource && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRawDataClick(groupSheetSource)}
                          >
                            <TableIcon className="h-4 w-4 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">ข้อมูลทั้งหมด</span>
                          </Button>
                        )}
                        {records[0]?.kpi_info_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onKPIInfoClick(records[0].kpi_info_id)}
                          >
                            <Info className="h-4 w-4 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">รายละเอียด KPI</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Records Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">กลุ่มเป้าหมาย</th>
                            <th className="text-left p-3 font-medium">หน่วยบริการ</th>
                            <th className="text-right p-3 font-medium">เป้าหมาย</th>
                            <th className="text-right p-3 font-medium">ผลงาน</th>
                            <th className="text-right p-3 font-medium">ร้อยละ</th>
                            <th className="text-right p-3 font-medium">เกณฑ์ผ่าน</th>
                            <th className="text-center p-3 font-medium">สถานะ</th>
                            <th className="text-center p-3 font-medium">การดำเนินการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record, index) => {
                            const percentage = calculatePercentage(record);
                            const threshold = parseFloat(record['เกณฑ์ผ่าน (%)']?.toString() || '0');
                            const hasResult = record['ผลงาน']?.toString().trim() !== '';
                            const sheetSource =
                              record.sheet_source?.trim() ||
                              (record as Record<string, string | undefined>)['แหล่งข้อมูล']?.trim();
                            return (
                              <tr key={record.service_code_ref || index} className="border-b hover:bg-muted/30 transition-colors">
                                <td className="p-3 align-top">
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="break-words">{record['กลุ่มเป้าหมาย']}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-medium break-words">{record['ชื่อหน่วยบริการ']}</td>
                                <td className="p-3 text-right font-mono">
                                  {formatNumber(record['เป้าหมาย'])}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {formatNumber(record['ผลงาน'])}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="space-y-1">
                                    <div className="font-semibold">{hasResult ? formatPercentage(percentage) : ''}</div>
                                    <Progress value={Math.min(percentage ?? 0, 100)} className="h-1.5" />
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono text-muted-foreground">
                                  {formatPercentage(threshold)}
                                </td>
                                <td className="p-3 text-center">
                                  {percentage !== null && hasResult ? getStatusBadge(percentage, threshold) : '-'}
                                </td>
                                <td className="p-3">
                                  <div className="flex space-x-1 justify-center">
                                    {sheetSource && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRawDataClick(sheetSource, record)}
                                        title="เฉพาะหน่วยนี้"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">ไม่พบข้อมูลตัวชี้วัดที่ตรงกับเงื่อนไข</p>
          </div>
        </Card>
      )}
    </div>
  );
};
