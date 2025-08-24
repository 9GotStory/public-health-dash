import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useKPIData, useKPIInfo } from "@/hooks/useKPIData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { KPIGroupCards } from "@/components/dashboard/KPIGroupCards";
import { KPIDetailTable } from "@/components/dashboard/KPIDetailTable";
import { KPIInfoModal } from "@/components/modals/KPIInfoModal";
import { RawDataModal } from "@/components/modals/RawDataModal";
import { FilterState, KPIRecord } from "@/types/kpi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { allData, loading, error, refetch } = useKPIData();
  const { kpiInfo, loading: kpiInfoLoading, fetchKPIInfo } = useKPIInfo();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'groups' | 'detail'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  // Modal states
  const [showKPIInfo, setShowKPIInfo] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [selectedRawDataSheet, setSelectedRawDataSheet] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<KPIRecord | null>(null);
  
  // Filter state
  const initialFilters: FilterState = {
    selectedGroup: '',
    selectedMainKPI: '',
    selectedSubKPI: '',
    selectedTarget: '',
    selectedService: '',
    statusFilters: []
  };
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Filter data based on current filters
  const filterData = (data: KPIRecord[]) => {
    return data.filter(item => {
      const matchesGroup = !filters.selectedGroup ||
        item['ประเด็นขับเคลื่อน'] === filters.selectedGroup;
      
      const matchesMainKPI = !filters.selectedMainKPI || 
        item['ตัวชี้วัดหลัก'] === filters.selectedMainKPI;
      
      const matchesSubKPI = !filters.selectedSubKPI || 
        item['ตัวชี้วัดย่อย'] === filters.selectedSubKPI;
      
      const matchesTarget = !filters.selectedTarget || 
        item['กลุ่มเป้าหมาย'] === filters.selectedTarget;
      
      const matchesService = !filters.selectedService ||
        item['ชื่อหน่วยบริการ'] === filters.selectedService;

      const percentage = parseFloat(item['ร้อยละ (%)']?.toString() || '0');
      const threshold = parseFloat(item['เกณฑ์ผ่าน (%)']?.toString() || '0');
      const status = percentage >= threshold
        ? 'passed'
        : percentage >= threshold * 0.8
          ? 'near'
          : 'failed';
      const matchesStatus =
        filters.statusFilters.length === 0 ||
        filters.statusFilters.includes(status);

      return (
        matchesGroup &&
        matchesMainKPI &&
        matchesSubKPI &&
        matchesTarget &&
        matchesService &&
        matchesStatus
      );
    });
  };

  const handleGroupClick = (groupName: string) => {
    setSelectedGroup(groupName);
    setFilters(prev => ({ ...prev, selectedGroup: groupName }));
    setCurrentView('detail');
  };

  const handleBackToGroups = () => {
    setCurrentView('groups');
    setSelectedGroup('');
    setFilters(initialFilters);
  };

  const handleKPIInfoClick = (kpiInfoId: string) => {
    fetchKPIInfo(undefined, kpiInfoId);
    setShowKPIInfo(true);
  };

  const handleRawDataClick = (sheetSource: string, record: KPIRecord) => {
    setSelectedRawDataSheet(sheetSource);
    setSelectedRecord(record);
    setShowRawData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">กำลังโหลดข้อมูล KPI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full">
          <Alert className="border-destructive">
            <AlertDescription className="text-center">
              <p className="font-semibold mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm mb-4">{error}</p>
              <Button onClick={refetch} size="sm">
                ลองใหม่
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  const filteredData = filterData(allData.configuration);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader 
          summary={allData.summary} 
          lastUpdate={allData.metadata?.lastUpdate}
        />

        {/* Filter Panel */}
        <FilterPanel 
          data={allData.configuration}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Main Content */}
        {currentView === 'groups' ? (
          <KPIGroupCards 
            data={filteredData}
            summary={allData.summary}
            onGroupClick={handleGroupClick}
          />
        ) : (
          <KPIDetailTable 
            data={filteredData}
            groupName={selectedGroup}
            onBack={handleBackToGroups}
            onKPIInfoClick={handleKPIInfoClick}
            onRawDataClick={handleRawDataClick}
          />
        )}

        {/* Modals */}
        <KPIInfoModal 
          isOpen={showKPIInfo}
          onClose={() => setShowKPIInfo(false)}
          kpiInfo={kpiInfo}
          loading={kpiInfoLoading}
        />

        <RawDataModal 
          isOpen={showRawData}
          onClose={() => setShowRawData(false)}
          sheetSource={selectedRawDataSheet}
          record={selectedRecord}
        />
      </div>
    </div>
  );
};

export default Index;
