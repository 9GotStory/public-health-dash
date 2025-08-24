import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";

interface KPIDetailTableProps {
  data: KPIRecord[];
  groupName?: string;
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
  const [sortField, setSortField] = useState<keyof KPIRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Group by main KPI first, then by sub KPI
  const groupedData = data.reduce((acc, item) => {
    const mainKPI = item['ตัวชี้วัดหลัก'];
    const subKPI = item['ตัวชี้วัดย่อย'];
    
    if (!acc[mainKPI]) acc[mainKPI] = {};
    if (!acc[mainKPI][subKPI]) acc[mainKPI][subKPI] = [];
    acc[mainKPI][subKPI].push(item);
    
    return acc;
  }, {} as Record<string, Record<string, KPIRecord[]>>);

  const getStatusBadge = (percentage: number, threshold: number) => {
    if (percentage >= threshold) {
      return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
    } else if (percentage >= threshold * 0.8) {
      return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
    } else {
      return <Badge variant="destructive">ไม่ผ่าน</Badge>;
    }
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? value : num.toLocaleString();
  };

  const formatPercentage = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '' : `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} size="sm">
              <i className="fa-solid fa-chevron-left mr-1"></i>
              กลับ
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">รายละเอียดตัวชี้วัด</h2>
            {groupName && (
              <p className="text-muted-foreground mt-1">ประเด็นขับเคลื่อน: {groupName}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          รวม {data.length} รายการ
        </div>
      </div>

      {/* Main KPI Groups */}
      <div className="space-y-8 border border-primary/20 rounded-lg p-4">
        {Object.entries(groupedData).map(([mainKPI, subKPIGroups]) => (
          <Card key={mainKPI} className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-primary mb-2">{mainKPI}</h3>
              <div className="h-1 bg-gradient-to-r from-primary to-primary/20 rounded-full"></div>
            </div>

            {/* Sub KPI Groups */}
            <div className="space-y-6">
              {Object.entries(subKPIGroups).map(([subKPI, records]) => {
                const groupSheetSource =
                  records[0]?.sheet_source?.trim() ||
                  (records[0] as Record<string, string | undefined>)['แหล่งข้อมูล']?.trim();

                return (
                  <div key={subKPI} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-secondary-foreground">{subKPI}</h4>
                      <div className="flex space-x-2">
                        {groupSheetSource && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRawDataClick(groupSheetSource)}
                          >
                            <i className="fa-solid fa-table-list mr-1"></i>
                            ข้อมูลทั้งหมด
                          </Button>
                        )}
                        {records[0]?.kpi_info_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onKPIInfoClick(records[0].kpi_info_id)}
                          >
                            <i className="fa-solid fa-circle-info mr-1"></i>
                            รายละเอียด KPI
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
                            <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <i className="fa-solid fa-users text-muted-foreground"></i>
                                  <span>{record['กลุ่มเป้าหมาย']}</span>
                                </div>
                              </td>
                              <td className="p-3 font-medium">{record['ชื่อหน่วยบริการ']}</td>
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
                                      <i className="fa-solid fa-eye"></i>
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

                  {/* Update Info */}
                  {records[0]?.['ข้อมูลวันที่'] && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center">
                      <i className="fa-solid fa-clock-rotate-left mr-1"></i>
                      อัพเดทล่าสุด: {records[0]['ข้อมูลวันที่']}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <i className="fa-solid fa-circle-exclamation text-6xl mx-auto mb-4 opacity-50"></i>
            <p className="text-lg">ไม่พบข้อมูลตัวชี้วัดที่ตรงกับเงื่อนไข</p>
          </div>
        </Card>
      )}
    </div>
  );
};
