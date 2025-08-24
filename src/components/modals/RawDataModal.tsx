import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Download, Calendar, AlertCircle } from "lucide-react";
import { KPIRecord } from "@/types/kpi";
import { useSourceData } from "@/hooks/useKPIData";

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetSource: string;
  record: KPIRecord | null;
}

export const RawDataModal = ({ isOpen, onClose, sheetSource, record }: RawDataModalProps) => {
  const { sourceData, loading, error, fetchSourceData } = useSourceData();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && sheetSource) {
      fetchSourceData(sheetSource);
    }
  }, [isOpen, sheetSource, fetchSourceData]);

  // Filter data based on search term
  const filteredData = sourceData.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value =>
      (value ?? '')
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  // Get column headers
  const headers = sourceData.length > 0 ? Object.keys(sourceData[0]) : [];

  const handleExport = () => {
    if (filteredData.length === 0) return;

    const csv = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sheetSource}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>กำลังโหลดข้อมูล</DialogTitle>
            <DialogDescription>กำลังโหลดข้อมูลดิบ</DialogDescription>
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
        <DialogContent className="max-w-2xl">
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
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center">
            <Database className="h-5 w-5 mr-2" />
            ข้อมูลดิบ: {sheetSource}
          </DialogTitle>
          <DialogDescription className="sr-only">
            ข้อมูลดิบจาก {sheetSource}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
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

          {/* Search and Actions */}
          <div className="flex items-center justify-between space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาในข้อมูล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {filteredData.length} / {sourceData.length} รายการ
              </Badge>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <ScrollArea className="h-[calc(90vh-16rem)] px-6">
          {filteredData.length > 0 ? (
            <div className="pb-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {headers.map((header, index) => (
                          <th 
                            key={index}
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
                                key={colIndex}
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
              </div>

              {/* Summary Info */}
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span>รวม {filteredData.length} รายการ</span>
                  <span>•</span>
                  <span>{headers.length} คอลัมน์</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  ดึงข้อมูลเมื่อ: {new Date().toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">
                {sourceData.length === 0 ? 'ไม่พบข้อมูลในแหล่งข้อมูลนี้' : 'ไม่พบข้อมูลที่ตรงกับการค้นหา'}
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
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-end">
          <Button onClick={onClose}>ปิด</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};