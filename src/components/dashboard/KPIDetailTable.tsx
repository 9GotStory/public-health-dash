import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KPIRecord } from "@/types/kpi";
import { calculatePercentage } from "@/lib/kpi";
import {
  AlertCircle,
  ChevronLeft,
  Eye,
  Info,
  Table as TableIcon,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
              <ChevronLeft className="h-4 w-4 mr-1" />
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
                            <TableIcon className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">ข้อมูลทั้งหมด</span>
                          </Button>
                        )}
                        {records[0]?.kpi_info_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onKPIInfoClick(records[0].kpi_info_id)}
                          >
                            <Info className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">รายละเอียด KPI</span>
                          </Button>
                        )}
                      </div>
                    </div>

                  {/* Records Table */}
                  <Table className="min-w-max text-sm">
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="p-3 text-left font-medium border-r border-border min-w-[180px] last:border-r-0">
                          กลุ่มเป้าหมาย
                        </TableHead>
                        <TableHead className="p-3 text-left font-medium border-r border-border min-w-[160px] last:border-r-0">
                          หน่วยบริการ
                        </TableHead>
                        <TableHead className="p-3 text-right font-medium border-r border-border last:border-r-0">
                          เป้าหมาย
                        </TableHead>
                        <TableHead className="p-3 text-right font-medium border-r border-border last:border-r-0">
                          ผลงาน
                        </TableHead>
                        <TableHead className="p-3 text-right font-medium border-r border-border last:border-r-0">
                          ร้อยละ
                        </TableHead>
                        <TableHead className="p-3 text-right font-medium border-r border-border last:border-r-0">
                          เกณฑ์ผ่าน
                        </TableHead>
                        <TableHead className="p-3 text-center font-medium border-r border-border last:border-r-0">
                          สถานะ
                        </TableHead>
                        <TableHead className="p-3 text-center font-medium last:border-r-0">
                          การดำเนินการ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, index) => {
                        const percentage = calculatePercentage(record);
                        const threshold = parseFloat(record['เกณฑ์ผ่าน (%)']?.toString() || '0');
                        const hasResult = record['ผลงาน']?.toString().trim() !== '';
                        const sheetSource =
                          record.sheet_source?.trim() ||
                          (record as Record<string, string | undefined>)['แหล่งข้อมูล']?.trim();
                        return (
                          <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="p-3 align-top border-r border-border last:border-r-0">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="break-words">{record['กลุ่มเป้าหมาย']}</span>
                              </div>
                            </TableCell>
                            <TableCell className="p-3 font-medium break-words border-r border-border last:border-r-0">
                              {record['ชื่อหน่วยบริการ']}
                            </TableCell>
                            <TableCell className="p-3 text-right font-mono border-r border-border last:border-r-0">
                              {formatNumber(record['เป้าหมาย'])}
                            </TableCell>
                            <TableCell className="p-3 text-right font-mono border-r border-border last:border-r-0">
                              {formatNumber(record['ผลงาน'])}
                            </TableCell>
                            <TableCell className="p-3 text-right border-r border-border last:border-r-0">
                              <div className="space-y-1">
                                <div className="font-semibold">{hasResult ? formatPercentage(percentage) : ''}</div>
                                <Progress value={Math.min(percentage ?? 0, 100)} className="h-1.5" />
                              </div>
                            </TableCell>
                            <TableCell className="p-3 text-right font-mono text-muted-foreground border-r border-border last:border-r-0">
                              {formatPercentage(threshold)}
                            </TableCell>
                            <TableCell className="p-3 text-center border-r border-border last:border-r-0">
                              {percentage !== null && hasResult ? getStatusBadge(percentage, threshold) : '-'}
                            </TableCell>
                            <TableCell className="p-3 last:border-r-0">
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">ไม่พบข้อมูลตัวชี้วัดที่ตรงกับเงื่อนไข</p>
          </div>
        </Card>
      )}
    </div>
  );
};
