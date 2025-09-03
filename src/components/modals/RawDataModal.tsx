import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Download, AlertCircle } from "lucide-react";
import { KPIRecord } from "@/types/kpi";
import { useSourceData } from "@/hooks/useKPIData";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetSource: string;
  record: KPIRecord | null;
}

export const RawDataModal = ({ isOpen, onClose, sheetSource, record }: RawDataModalProps) => {
  const { sourceData, loading, error, fetchSourceData } = useSourceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'row'>(record ? 'row' : 'all');

  useEffect(() => {
    if (isOpen && sheetSource) {
      fetchSourceData(sheetSource);
    }
  }, [isOpen, sheetSource, fetchSourceData]);

  useEffect(() => {
    setViewMode(record ? 'row' : 'all');
  }, [record, isOpen]);

  const matchRecord = useCallback((row: Record<string, unknown>) => {
    if (!record) return true;
    const code = record.service_code_ref ? record.service_code_ref.toString().trim() : '';
    const name = record['ชื่อหน่วยบริการ'] ? record['ชื่อหน่วยบริการ'].toString().trim() : '';
    return Object.values(row).some(value => {
      const v = value?.toString().trim();
      return (code && v === code) || (name && v === name);
    });
  }, [record]);

  const viewData = useMemo(
    () => (viewMode === 'row' ? sourceData.filter(matchRecord) : sourceData),
    [viewMode, sourceData, matchRecord]
  );

  // Filter data based on search term
  const filteredData = useMemo(
    () =>
      viewData.filter(row => {
        if (!searchTerm) return true;
        return Object.values(row).some(value =>
          (value ?? '')
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      }),
    [viewData, searchTerm]
  );

  // Get column headers
  const headers = useMemo(() => (viewData.length > 0 ? Object.keys(viewData[0]) : []), [viewData]);

  const handleExport = () => {
    if (filteredData.length === 0) return;

    const tableHeader = headers.map(h => `<th>${h}</th>`).join('');
    const tableRows = filteredData
      .map(row =>
        `<tr>${headers
          .map(h => `<td>${row[h] ?? ''}</td>`)
          .join('')}</tr>`
      )
      .join('');
    const html = `<table><thead><tr>${tableHeader}</tr></thead><tbody>${tableRows}</tbody></table>`;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sheetSource}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-[calc(100vw-4rem)] h-[calc(100vh-4rem)]">
          <DialogHeader className="sr-only">
            <DialogTitle>กำลังโหลดข้อมูล</DialogTitle>
            <DialogDescription>กำลังโหลดข้อมูล</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-[calc(100vw-4rem)] h-[calc(100vh-4rem)]">
          <DialogHeader className="sr-only">
            <DialogTitle>เกิดข้อผิดพลาด</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchSourceData(sheetSource)}>
              ลองใหม่
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex flex-col sm:flex-row sm:items-center">
            <span className="flex items-center">
              <Database className="h-5 w-5 mr-2" />ข้อมูล:
            </span>
            <span className="sm:ml-2">{sheetSource}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            ข้อมูลจาก {sheetSource}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 space-y-4">
          {/* Info Card */}
          {record && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-primary">ตัวชี้วัด:</span>
                  <p className="mt-1">{record['ตัวชี้วัดย่อย']}</p>
                </div>
                <div>
                  <span className="font-medium text-primary">หน่วยบริการ:</span>
                  <p className="mt-1">{record['ชื่อหน่วยบริการ']}</p>
                </div>
                <div>
                  <span className="font-medium text-primary">กลุ่มเป้าหมาย:</span>
                  <p className="mt-1">{record['กลุ่มเป้าหมาย']}</p>
                </div>
              </div>
            </Card>
          )}

          {/* View Mode Tabs */}
          {record && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'row')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="row">เฉพาะหน่วยนี้</TabsTrigger>
                <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาในข้อมูล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {filteredData.length} / {viewData.length} รายการ
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExport} className="whitespace-nowrap">
                <Download className="h-4 w-4 mr-1" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 px-4 sm:px-6 min-h-0">
          {filteredData.length > 0 ? (
            <div className="pb-6 h-full flex flex-col min-h-0">
              <div className="border rounded-lg flex-1 overflow-auto">
                <table className="min-w-max w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="text-left p-3 font-medium border-r border-border last:border-r-0 min-w-[120px]"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        {headers.map((header, colIndex) => {
                          const value = row[header];
                          const isNumber = !isNaN(Number(value)) && value !== '' && value !== null;

                          return (
                            <td
                              key={header}
                              className={`p-3 border-r border-border last:border-r-0 ${
                                isNumber ? 'text-right font-mono' : 'text-left'
                              }`}
                            >
                              {value || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Info */}
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>{filteredData.length} รายการ</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{headers.length} คอลัมน์</span>
                </div>
                <div className="flex items-center sm:ml-auto sm:justify-end text-right">
                  <span className="mr-1">ข้อมูล</span>
                  <span>{new Date().toLocaleString('th-TH')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">
                {viewData.length === 0 ? 'ไม่พบข้อมูลในแหล่งข้อมูลนี้' : 'ไม่พบข้อมูลที่ตรงกับการค้นหา'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  ล้างการค้นหา
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end">
          <Button onClick={onClose}>ปิด</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
