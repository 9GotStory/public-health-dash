import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Target, 
  Users, 
  Calculator, 
  BookOpen, 
  Building2, 
  Phone, 
  Link,
  Calendar,
  CheckCircle,
  Info,
  AlertCircle
} from "lucide-react";
import { KPIInfo } from "@/types/kpi";

interface KPIInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiInfo: KPIInfo | null;
  loading: boolean;
}

export const KPIInfoModal = ({ isOpen, onClose, kpiInfo, loading }: KPIInfoModalProps) => {
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">กำลังโหลดข้อมูล...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!kpiInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลรายละเอียด KPI</h3>
            <p className="text-muted-foreground">ข้อมูลรายละเอียดของตัวชี้วัดนี้ไม่พร้อมใช้งาน</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const InfoSection = ({ icon, title, content, className = "" }: {
    icon: React.ReactNode;
    title: string;
    content: string | undefined;
    className?: string;
  }) => {
    if (!content || content.trim() === '') return null;
    
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="text-primary mt-1">{icon}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">{title}</h4>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{content}</div>
          </div>
        </div>
      </Card>
    );
  };

  const DataVariableCard = ({ title, content, index }: {
    title: string;
    content: string | undefined;
    index: number;
  }) => {
    if (!content || content.trim() === '') return null;
    
    return (
      <div className="border rounded-lg p-3 bg-muted/20">
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant="outline" className="text-xs">
            ตัวแปรที่ {index}
          </Badge>
        </div>
        <p className="text-sm">{content}</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            รายละเอียดตัวชี้วัด: {kpiInfo['ตัวชี้วัดหลัก']}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] px-6">
          <div className="space-y-6 pb-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<Target className="h-4 w-4" />}
                title="ตัวชี้วัดย่อย"
                content={kpiInfo['ตัวชี้วัดย่อย']}
              />
              <InfoSection
                icon={<Users className="h-4 w-4" />}
                title="กลุ่มเป้าหมาย"
                content={kpiInfo['กลุ่มเป้าหมาย']}
              />
            </div>

            {/* Definition */}
            <InfoSection
              icon={<FileText className="h-4 w-4" />}
              title="คำนิยาม"
              content={kpiInfo['คำนิยาม']}
              className="col-span-full"
            />

            {/* Criteria and Population */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<CheckCircle className="h-4 w-4" />}
                title="เกณฑ์เป้าหมาย"
                content={kpiInfo['เกณฑ์เป้าหมาย']}
              />
              <InfoSection
                icon={<Users className="h-4 w-4" />}
                title="ประชากรกลุ่มเป้าหมาย"
                content={kpiInfo['ประชากรกลุ่มเป้าหมาย']}
              />
            </div>

            {/* Data Collection and Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<Info className="h-4 w-4" />}
                title="วิธีการจัดเก็บข้อมูล"
                content={kpiInfo['วิธีการจัดเก็บข้อมูล']}
              />
              <InfoSection
                icon={<Building2 className="h-4 w-4" />}
                title="แหล่งข้อมูล"
                content={kpiInfo['แหล่งข้อมูล']}
              />
            </div>

            {/* Data Variables */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                รายการข้อมูลและตัวแปร
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DataVariableCard
                  title="รายการข้อมูล 1"
                  content={kpiInfo['รายการข้อมูล_1']}
                  index={1}
                />
                <DataVariableCard
                  title="รายการข้อมูล 2"
                  content={kpiInfo['รายการข้อมูล_2']}
                  index={2}
                />
                <DataVariableCard
                  title="รายการข้อมูล 3"
                  content={kpiInfo['รายการข้อมูล_3']}
                  index={3}
                />
                <DataVariableCard
                  title="รายการข้อมูล 4"
                  content={kpiInfo['รายการข้อมูล_4']}
                  index={4}
                />
              </div>
            </Card>

            {/* Calculation Formula */}
            {kpiInfo['สูตรการคำนวณ'] && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-sm text-primary mb-3 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  สูตรการคำนวณ
                </h4>
                <div className="bg-background p-3 rounded border font-mono text-sm">
                  {kpiInfo['สูตรการคำนวณ']}
                </div>
              </Card>
            )}

            {/* Documents and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<BookOpen className="h-4 w-4" />}
                title="เอกสารสนับสนุน"
                content={kpiInfo['เอกสารสนับสนุน']}
              />
              <InfoSection
                icon={<Link className="h-4 w-4" />}
                title="แหล่งอ้างอิง"
                content={kpiInfo['แหล่งอ้างอิง']}
              />
            </div>

            {/* Responsible Organization and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<Building2 className="h-4 w-4" />}
                title="หน่วยงานรับผิดชอบ"
                content={kpiInfo['หน่วยงานรับผิดชอบ']}
              />
              <InfoSection
                icon={<Phone className="h-4 w-4" />}
                title="ผู้ประสานงาน"
                content={kpiInfo['ผู้ประสานงาน']}
              />
            </div>

            {/* Notes and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection
                icon={<FileText className="h-4 w-4" />}
                title="หมายเหตุ"
                content={kpiInfo['หมายเหตุ']}
              />
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">สถานะ</h4>
                    <Badge 
                      variant={kpiInfo['สถานะใช้งาน'] === 'Active' ? 'default' : 'secondary'}
                      className={kpiInfo['สถานะใช้งาน'] === 'Active' ? 'bg-success text-success-foreground' : ''}
                    >
                      {kpiInfo['สถานะใช้งาน'] === 'Active' ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Timestamp Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">วันที่สร้าง</h4>
                    <p className="text-sm">{kpiInfo['วันที่สร้าง']}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">วันที่แก้ไขล่าสุด</h4>
                    <p className="text-sm">{kpiInfo['วันที่แก้ไขล่าสุด']}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                พิมพ์
              </Button>
              <Button onClick={onClose}>
                ปิด
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};