import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useKPIData, useKPIInfo } from "@/hooks/useKPIData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { KPIGroupCards } from "@/components/dashboard/KPIGroupCards";
import { KPIDetailTable } from "@/components/dashboard/KPIDetailTable";
import { KPIInfoModal } from "@/components/modals/KPIInfoModal";
import { RawDataModal } from "@/components/modals/RawDataModal";
import { FilterState, KPIRecord, SummaryStats } from "@/types/kpi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { calculatePercentage } from "@/lib/kpi";

const calculateSummary = (data: KPIRecord[]): SummaryStats => {
  const summary: SummaryStats = {
    totalKPIs: 0,
    averagePercentage: 0,
    passedKPIs: 0,
    failedKPIs: 0,
    groupStats: {},
  };

  const kpiMap: Record<string, {
    group: string;
    threshold: number;
    percentages: number[];
  }> = {};

  data.forEach(item => {
    const percentage = calculatePercentage(item);
    if (percentage === null) return;

    const key = item.kpi_info_id ||
      `${item['ตัวชี้วัดหลัก']}|${item['ตัวชี้วัดย่อย']}|${item['กลุ่มเป้าหมาย']}`;

    if (!kpiMap[key]) {
      kpiMap[key] = {
        group: item['ประเด็นขับเคลื่อน'],
        threshold: parseFloat(item['เกณฑ์ผ่าน (%)']?.toString() || '0'),
        percentages: [],
      };
    }

    kpiMap[key].percentages.push(percentage);
  });

  Object.values(kpiMap).forEach(({ group, threshold, percentages }) => {
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const passed = average >= threshold;

    summary.totalKPIs++;
    summary.averagePercentage += average;
    if (passed) summary.passedKPIs++; else summary.failedKPIs++;

    if (!summary.groupStats[group]) {
      summary.groupStats[group] = {
        count: 0,
        totalPercentage: 0,
        passed: 0,
        failed: 0,
        averagePercentage: 0,
      };
    }
    const g = summary.groupStats[group];
    g.count++;
    g.totalPercentage += average;
    if (passed) g.passed++; else g.failed++;
  });

  Object.values(summary.groupStats).forEach(g => {
    g.averagePercentage = g.count > 0 ? g.totalPercentage / g.count : 0;
  });

  summary.averagePercentage = summary.totalKPIs > 0
    ? summary.averagePercentage / summary.totalKPIs
    : 0;

  return summary;
};

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

  // Apply cascading filters excluding status
  const applyBasicFilters = (data: KPIRecord[]) => {
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
      return (
        matchesGroup &&
        matchesMainKPI &&
        matchesSubKPI &&
        matchesTarget &&
        matchesService
      );
    });
  };

  // Apply status filters based on current view
  const applyStatusFilter = (data: KPIRecord[]) => {
    if (filters.statusFilters.length === 0) return data;

    if (currentView === 'groups') {
      const groupStats = calculateSummary(data).groupStats;
      const groupStatusMap: Record<string, string> = Object.entries(groupStats).reduce((acc, [group, stats]) => {
        const avg = stats?.averagePercentage || 0;
        const status = avg >= 80 ? 'passed' : avg >= 60 ? 'near' : 'failed';
        acc[group] = status;
        return acc;
      }, {} as Record<string, string>);

      return data.filter(item => {
        const status = groupStatusMap[item['ประเด็นขับเคลื่อน']];
        if (!status) return false;
        return filters.statusFilters.includes(status);
      });
    }

    return data.filter(item => {
      const percentage = calculatePercentage(item);
      const resultRaw = item['ผลงาน']?.toString().trim();
      if (percentage === null || !resultRaw) return false;
      const threshold = parseFloat(item['เกณฑ์ผ่าน (%)']?.toString() || '0');
      const status = percentage >= threshold
        ? 'passed'
        : percentage >= threshold * 0.8
          ? 'near'
          : 'failed';
      return filters.statusFilters.includes(status);
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

  const handleRawDataClick = (sheetSource: string, record?: KPIRecord) => {
    setSelectedRawDataSheet(sheetSource);
    setSelectedRecord(record ?? null);
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

  const basicFilteredData = applyBasicFilters(allData.configuration);
  const filteredData = applyStatusFilter(basicFilteredData);
  const filteredSummary = calculateSummary(filteredData);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader
          summary={filteredSummary}
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
            summary={filteredSummary}
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
