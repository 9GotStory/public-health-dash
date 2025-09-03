import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import { formatNumber, formatPercentage } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
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

// Displays KPI details grouped by main and sub indicators.

interface KPIDetailTableProps {
  data: KPIRecord[];
  groupName?: string;
  groupIcon?: LucideIcon;
  mainKPIName?: string;
  subKPIName?: string;
  targetName?: string;
  onBack?: () => void;
  onNavigateToGroup?: () => void;
  onNavigateToMain?: () => void;
  onNavigateToSub?: () => void;
  onKPIInfoClick: (kpiInfoId: string) => void;
  onRawDataClick: (sheetSource: string, record?: KPIRecord) => void;
}

export const KPIDetailTable = ({
  data,
  groupName,
  groupIcon: IconComponent = Activity,
  mainKPIName,
  subKPIName,
  targetName,
  onBack,
  onNavigateToGroup,
  onNavigateToMain,
  onNavigateToSub,
  onKPIInfoClick,
  onRawDataClick
}: KPIDetailTableProps) => {
  const canNavigateToMain = useMemo(() => {
    // Allow navigate to sub view only if there is any non-empty sub-KPI in data
    return data.some((item) => (item['ตัวชี้วัดย่อย']?.toString().trim() || '') !== '');
  }, [data]);

  const canNavigateToSub = useMemo(() => {
    // Allow navigate to target view only if there is any non-empty target in data
    return data.some((item) => (item['กลุ่มเป้าหมาย']?.toString().trim() || '') !== '');
  }, [data]);
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

  // No summary card in detail view; breadcrumb replaces the summary.

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
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          รวม {data.length} รายการ
        </div>
      </div>

      {(groupName || mainKPIName || subKPIName || targetName) && (
        <nav aria-label="Breadcrumb" className="text-sm">
          <div className="flex items-center text-muted-foreground flex-wrap gap-1">
            {groupName && (
              <button
                type="button"
                onClick={onNavigateToGroup}
                className="text-primary hover:underline"
                title="ไปที่ตัวชี้วัดหลัก"
              >
                {groupName}
              </button>
            )}
            {mainKPIName && <span className="mx-1">/</span>}
            {mainKPIName && (
              canNavigateToMain && onNavigateToMain ? (
                <button
                  type="button"
                  onClick={onNavigateToMain}
                  className="text-primary hover:underline"
                  title="ไปที่ตัวชี้วัดย่อย"
                >
                  ตัวชี้วัดหลัก: {mainKPIName}
                </button>
              ) : (
                <span className="text-foreground">ตัวชี้วัดหลัก: {mainKPIName}</span>
              )
            )}
            {subKPIName && <span className="mx-1">/</span>}
            {subKPIName && (
              canNavigateToSub && onNavigateToSub ? (
                <button
                  type="button"
                  onClick={onNavigateToSub}
                  className="text-primary hover:underline"
                  title="ไปที่กลุ่มเป้าหมาย"
                >
                  ตัวชี้วัดย่อย: {subKPIName}
                </button>
              ) : (
                <span className="text-foreground">ตัวชี้วัดย่อย: {subKPIName}</span>
              )
            )}
            {targetName && <span className="mx-1">/</span>}
            {targetName && (
              <span className="text-foreground">กลุ่มเป้าหมาย: {targetName}</span>
            )}
          </div>
        </nav>
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

                const threshold = parseFloat(
                  records[0]['เกณฑ์ผ่าน (%)']?.toString() || '0'
                );

                return (
                  <Card key={subKPI} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-secondary-foreground break-words">
                        {subKPI}
                      </h4>
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
                          <tr>
                            <th
                              colSpan={7}
                              className="p-3 text-right font-medium text-muted-foreground"
                            >
                              เกณฑ์ผ่าน: {formatPercentage(threshold)}
                            </th>
                          </tr>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">กลุ่มเป้าหมาย</th>
                            <th className="text-left p-3 font-medium">หน่วยบริการ</th>
                            <th className="text-right p-3 font-medium">เป้าหมาย</th>
                            <th className="text-right p-3 font-medium">ผลงาน</th>
                            <th className="text-right p-3 font-medium">ร้อยละ</th>
                            <th className="text-center p-3 font-medium">สถานะ</th>
                            <th className="text-center p-3 font-medium">การดำเนินการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record, index) => {
                            const percentage = calculatePercentage(record);
                            const hasResult = record['ผลงาน']?.toString().trim() !== '';
                            const sheetSource =
                              record.sheet_source?.trim() ||
                              (record as Record<string, string | undefined>)['แหล่งข้อมูล']?.trim();
                            return (
                              <tr
                                key={record.service_code_ref || index}
                                className="border-b hover:bg-muted/30 transition-colors"
                              >
                                <td className="p-3 align-top">
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="break-words">{record['กลุ่มเป้าหมาย']}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-medium break-words">
                                  {record['ชื่อหน่วยบริการ']}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {formatNumber(record['เป้าหมาย'])}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {formatNumber(record['ผลงาน'])}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="space-y-1">
                                    <div className="font-semibold">
                                      {hasResult ? formatPercentage(percentage) : ''}
                                    </div>
                                    <Progress
                                      value={Math.min(percentage ?? 0, 100)}
                                      className="h-1.5"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  {percentage !== null && hasResult ? (
                                    <StatusBadge
                                      percentage={percentage}
                                      threshold={threshold}
                                    />
                                  ) : (
                                    '-'
                                  )}
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
