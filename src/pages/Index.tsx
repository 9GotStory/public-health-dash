import { useState } from "react";
import { Loader2, Brain, Pill, Ribbon, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useKPIData, useKPIInfo } from "@/hooks/useKPIData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { KPIGroupCards } from "@/components/dashboard/KPIGroupCards";
import { MainKPICards } from "@/components/dashboard/MainKPICards";
import { SubKPICards } from "@/components/dashboard/SubKPICards";
import { TargetCards } from "@/components/dashboard/TargetCards";
import { KPIDetailTable } from "@/components/dashboard/KPIDetailTable";
import { KPIInfoModal } from "@/components/modals/KPIInfoModal";
import { RawDataModal } from "@/components/modals/RawDataModal";
import { FilterState, KPIRecord, SummaryStats } from "@/types/kpi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { calculatePercentage, getAbsoluteStatus, getThresholdStatus } from "@/lib/kpi";
import { calculateSummary } from "@/lib/summary";
import { deriveBackLevelFromTarget, deriveBackLevelFromDetail } from "@/lib/navigation";

// calculateSummary moved to src/lib/summary.ts

const Index = () => {
  const { allData, loading, error, refetch } = useKPIData();
  const { kpiInfo, loading: kpiInfoLoading, fetchKPIInfo } = useKPIInfo();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'groups' | 'main' | 'sub' | 'target' | 'detail'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedGroupIcon, setSelectedGroupIcon] = useState<LucideIcon | null>(null);
  const [selectedMainKPI, setSelectedMainKPI] = useState<string>('');
  const [selectedSubKPI, setSelectedSubKPI] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [skippedSubView, setSkippedSubView] = useState<boolean>(false);
  const [skippedMainView, setSkippedMainView] = useState<boolean>(false);
  
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

  // Keep navigation state and filters in sync when filters change from the panel/tag removal
  const handleFiltersChange = (next: FilterState) => {
    // Clear status filters when changing key hierarchy (group/main/sub) or target
    const hierarchyChanged =
      next.selectedGroup !== filters.selectedGroup ||
      next.selectedMainKPI !== filters.selectedMainKPI ||
      next.selectedSubKPI !== filters.selectedSubKPI ||
      next.selectedTarget !== filters.selectedTarget;

    const apply: FilterState = hierarchyChanged
      ? { ...next, statusFilters: [] }
      : next;

    setFilters(apply);

    // Sync selected states
    setSelectedGroup(apply.selectedGroup || '');
    setSelectedMainKPI(apply.selectedMainKPI || '');
    setSelectedSubKPI(apply.selectedSubKPI || '');
    setSelectedTarget(apply.selectedTarget || '');

    // Set or reset group icon based on selected group for better UX
    if (!apply.selectedGroup) {
      setSelectedGroupIcon(null);
    } else {
      const name = apply.selectedGroup;
      const pickIcon = (groupName: string) => {
        if (groupName.includes('สุขภาพจิต')) return Brain;
        if (groupName.includes('ยาเสพติด')) return Pill;
        if (groupName.includes('มะเร็ง')) return Ribbon;
        return Activity;
      };
      setSelectedGroupIcon(pickIcon(name));
    }

    // Derive view solely from presence of hierarchical selections
    if (!apply.selectedGroup) {
      setCurrentView('groups');
      setSkippedMainView(false);
      setSkippedSubView(false);
      return;
    }
    if (!apply.selectedMainKPI) {
      setCurrentView('main');
      setSkippedMainView(false);
      setSkippedSubView(false);
      return;
    }
    if (!apply.selectedSubKPI) {
      setCurrentView('sub');
      setSkippedSubView(false);
      return;
    }
    if (!apply.selectedTarget) {
      setCurrentView('target');
      return;
    }
    setCurrentView('detail');
  };

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
        acc[group] = getAbsoluteStatus(avg);
        return acc;
      }, {} as Record<string, string>);

      return data.filter(item => {
        const st = groupStatusMap[item['ประเด็นขับเคลื่อน']];
        if (!st) return false;
        return filters.statusFilters.includes(st);
      });
    }

    if (currentView === 'main') {
      // Map main KPI -> status using average of its sub-KPIs (first-row summary per sub)
      const perMain: Record<string, { sums: number; count: number }> = {};
      const grouped: Record<string, Record<string, KPIRecord[]>> = data.reduce((m, item) => {
        const main = item['ตัวชี้วัดหลัก'];
        const sub = item['ตัวชี้วัดย่อย'];
        if (!m[main]) m[main] = {} as Record<string, KPIRecord[]>;
        if (!m[main][sub]) m[main][sub] = [];
        m[main][sub].push(item);
        return m;
      }, {} as Record<string, Record<string, KPIRecord[]>>);

      Object.entries(grouped).forEach(([main, subMap]) => {
        let sums = 0; let count = 0;
        Object.values(subMap).forEach(records => {
          const p = calculatePercentage(records[0]) ?? 0;
          sums += p; count += 1;
        });
        perMain[main] = { sums, count };
      });

      const mainStatus: Record<string, string> = Object.entries(perMain).reduce((acc, [main, { sums, count }]) => {
        const avg = count > 0 ? sums / count : 0;
        acc[main] = getAbsoluteStatus(avg);
        return acc;
      }, {} as Record<string, string>);

      return data.filter(item => filters.statusFilters.includes(mainStatus[item['ตัวชี้วัดหลัก']]));
    }

    if (currentView === 'sub') {
      // Status based on each sub-KPI's percentage (first-row summary)
      const subStatus: Record<string, string> = {};
      const firstRowBySub: Record<string, KPIRecord> = {};
      data.forEach(item => {
        const sub = item['ตัวชี้วัดย่อย'];
        if (!firstRowBySub[sub]) firstRowBySub[sub] = item;
      });
      Object.entries(firstRowBySub).forEach(([sub, rec]) => {
        const p = calculatePercentage(rec);
        const res = rec['ผลงาน']?.toString().trim();
        if (p === null || !res) { subStatus[sub] = 'failed'; return; }
        const th = parseFloat(rec['เกณฑ์ผ่าน (%)']?.toString() || '0');
        subStatus[sub] = getThresholdStatus(p, th);
      });

      return data.filter(item => filters.statusFilters.includes(subStatus[item['ตัวชี้วัดย่อย']]));
    }

    if (currentView === 'target') {
      const targetStatus: Record<string, string> = {};
      const firstRowByTarget: Record<string, KPIRecord> = {};
      data.forEach(item => {
        const target = item['กลุ่มเป้าหมาย'];
        if (!firstRowByTarget[target]) firstRowByTarget[target] = item;
      });
      Object.entries(firstRowByTarget).forEach(([target, rec]) => {
        const p = calculatePercentage(rec);
        const res = rec['ผลงาน']?.toString().trim();
        if (p === null || !res) { targetStatus[target] = 'failed'; return; }
        const th = parseFloat(rec['เกณฑ์ผ่าน (%)']?.toString() || '0');
        targetStatus[target] = getThresholdStatus(p, th);
      });
      return data.filter(item => filters.statusFilters.includes(targetStatus[item['กลุ่มเป้าหมาย']]));
    }

    return data.filter(item => {
      const percentage = calculatePercentage(item);
      const resultRaw = item['ผลงาน']?.toString().trim();
      if (percentage === null || !resultRaw) return false;
      const threshold = parseFloat(item['เกณฑ์ผ่าน (%)']?.toString() || '0');
      const status = getThresholdStatus(percentage, threshold);
      return filters.statusFilters.includes(status);
    });
  };

  const handleGroupClick = (groupName: string, icon: LucideIcon) => {
    const nextFilters: FilterState = {
      ...filters,
      selectedGroup: groupName,
      selectedMainKPI: '',
      selectedSubKPI: '',
      selectedTarget: '',
    };
    handleFiltersChange(nextFilters);
    setSelectedGroupIcon(icon);

    // Smart skip: evaluate available dimensions under this group
    try {
      const base = allData?.configuration ?? [];
      const recordsForGroup = base.filter(i => i['ประเด็นขับเคลื่อน'] === groupName);
      const uniqueMains = Array.from(new Set(
        recordsForGroup.map(i => i['ตัวชี้วัดหลัก']?.toString().trim()).filter(v => !!v)
      ));

      if (uniqueMains.length === 0) {
        setCurrentView('detail');
        return;
      }

      if (uniqueMains.length === 1) {
        // skip main view
        const onlyMain = uniqueMains[0] as string;
        setSelectedMainKPI(onlyMain);
        setFilters(prev => ({ ...prev, selectedMainKPI: onlyMain }));
        setSkippedMainView(true);

        const recordsForMain = recordsForGroup.filter(i => (i['ตัวชี้วัดหลัก']?.toString().trim() || '') === onlyMain);
        const uniqueSubs = Array.from(new Set(
          recordsForMain.map(i => i['ตัวชี้วัดย่อย']?.toString().trim()).filter(v => !!v)
        ));
        const uniqueTargets = Array.from(new Set(
          recordsForMain.map(i => i['กลุ่มเป้าหมาย']?.toString().trim()).filter(v => !!v)
        ));

        if (uniqueSubs.length === 0) {
          if (uniqueTargets.length === 0) { setCurrentView('detail'); return; }
          if (uniqueTargets.length === 1) {
            const onlyTarget = uniqueTargets[0] as string;
            setSelectedTarget(onlyTarget);
            setFilters(prev => ({ ...prev, selectedTarget: onlyTarget }));
            setCurrentView('detail');
            return;
          }
          setCurrentView('target');
          return;
        }

        if (uniqueSubs.length === 1) {
          const onlySub = uniqueSubs[0] as string;
          setSelectedSubKPI(onlySub);
          setFilters(prev => ({ ...prev, selectedSubKPI: onlySub }));
          setSkippedSubView(true);

          const recordsForOnlySub = recordsForMain.filter(i => (i['ตัวชี้วัดย่อย']?.toString().trim() || '') === onlySub);
          const targetsForOnlySub = Array.from(new Set(
            recordsForOnlySub.map(i => i['กลุ่มเป้าหมาย']?.toString().trim()).filter(v => !!v)
          ));
          if (targetsForOnlySub.length === 0) { setCurrentView('detail'); return; }
          if (targetsForOnlySub.length === 1) {
            const onlyTarget = targetsForOnlySub[0] as string;
            setSelectedTarget(onlyTarget);
            setFilters(prev => ({ ...prev, selectedTarget: onlyTarget }));
            setCurrentView('detail');
            return;
          }
          setCurrentView('target');
          return;
        }

        setCurrentView('sub');
        return;
      }
    } catch {
      // fallthrough
    }

    setCurrentView('main');
  };

  const handleBackToGroups = () => {
    setCurrentView('groups');
    setSelectedGroup('');
    setSelectedGroupIcon(null);
    setSelectedMainKPI('');
    setSelectedSubKPI('');
    setSelectedTarget('');
    setSkippedSubView(false);
    setSkippedMainView(false);
    setFilters(initialFilters);
  };

  const handleMainKPIClick = (mainKPI: string) => {
    setSelectedMainKPI(mainKPI);
    setSelectedSubKPI('');
    setSelectedTarget('');
    handleFiltersChange({ ...filters, selectedMainKPI: mainKPI, selectedSubKPI: '', selectedTarget: '' });

    // Decide next step based on availability of sub KPI and target dimensions
    try {
      const base = allData?.configuration ?? [];
      const recordsForMain = base.filter(i =>
        i['ประเด็นขับเคลื่อน'] === selectedGroup &&
        i['ตัวชี้วัดหลัก'] === mainKPI
      );

      const uniqueSubs = Array.from(new Set(
        recordsForMain.map(i => i['ตัวชี้วัดย่อย']?.toString().trim()).filter(v => !!v)
      ));
      const uniqueTargets = Array.from(new Set(
        recordsForMain.map(i => i['กลุ่มเป้าหมาย']?.toString().trim()).filter(v => !!v)
      ));

      if (uniqueSubs.length === 0) {
        // No sub KPI dimension
        setSkippedSubView(false);
        if (uniqueTargets.length === 0) {
          // No target either -> go directly to details
          setCurrentView('detail');
          return;
        }
        if (uniqueTargets.length === 1) {
          // Auto-select the single target and go details
          const onlyTarget = uniqueTargets[0] as string;
          setSelectedTarget(onlyTarget);
          setFilters(prev => ({ ...prev, selectedTarget: onlyTarget }));
          setCurrentView('detail');
          return;
        }
        // Multiple targets available, go to target cards (without sub)
        setCurrentView('target');
        return;
      }

      if (uniqueSubs.length === 1) {
        // Exactly one sub KPI -> skip sub view
        const onlySub = uniqueSubs[0] as string;
        setSelectedSubKPI(onlySub);
        setFilters(prev => ({ ...prev, selectedSubKPI: onlySub }));
        setSkippedSubView(true);

        const recordsForOnlySub = recordsForMain.filter(i => (i['ตัวชี้วัดย่อย']?.toString().trim() || '') === onlySub);
        const targetsForOnlySub = Array.from(new Set(
          recordsForOnlySub.map(i => i['กลุ่มเป้าหมาย']?.toString().trim()).filter(v => !!v)
        ));

        if (targetsForOnlySub.length === 0) {
          setCurrentView('detail');
          return;
        }
        if (targetsForOnlySub.length === 1) {
          const onlyTarget = targetsForOnlySub[0] as string;
          setSelectedTarget(onlyTarget);
          setFilters(prev => ({ ...prev, selectedTarget: onlyTarget }));
          setCurrentView('detail');
          return;
        }

        setCurrentView('target');
        return;
      }
    } catch {
      // Ignore and proceed to sub view
    }

    setSkippedSubView(false);
    setCurrentView('sub');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedMainKPI('');
    setSelectedSubKPI('');
    setSelectedTarget('');
    setSkippedSubView(false);
    setSkippedMainView(false);
    handleFiltersChange({
      ...filters,
      selectedMainKPI: '',
      selectedSubKPI: '',
      selectedTarget: '',
      selectedService: '',
      statusFilters: []
    });
  };

  const handleBackToSub = () => {
    setCurrentView('sub');
    setSelectedTarget('');
    setSelectedSubKPI('');
    setSkippedSubView(false);
    handleFiltersChange({ ...filters, selectedSubKPI: '', selectedTarget: '', selectedService: '', statusFilters: [] });
  };

  // From detail back to sub while also clearing selected sub-KPI as requested
  const handleBackToSubClearingSub = () => {
    setCurrentView('sub');
    setSelectedTarget('');
    setSelectedSubKPI('');
    setSkippedSubView(false);
    handleFiltersChange({ ...filters, selectedTarget: '', selectedSubKPI: '', selectedService: '', statusFilters: [] });
  };

  const handleBackToTarget = () => {
    setCurrentView('target');
    setSelectedTarget('');
    handleFiltersChange({ ...filters, selectedTarget: '', selectedService: '', statusFilters: [] });
  };

  const handleSubKPIClick = (subKPI: string) => {
    setSelectedSubKPI(subKPI);
    setSelectedTarget('');
    setSkippedSubView(false);
    handleFiltersChange({ ...filters, selectedSubKPI: subKPI, selectedTarget: '' });

    // If no non-empty targets for this sub KPI, jump directly to detail
    try {
      const base = allData?.configuration ?? [];
      const recordsForSub = base.filter(i =>
        i['ประเด็นขับเคลื่อน'] === selectedGroup &&
        i['ตัวชี้วัดหลัก'] === selectedMainKPI &&
        i['ตัวชี้วัดย่อย'] === subKPI
      );
      const uniqueTargets = Array.from(new Set(
        recordsForSub
          .map(i => i['กลุ่มเป้าหมาย']?.toString().trim())
          .filter(v => !!v)
      ));
      if (uniqueTargets.length === 0) {
        setCurrentView('detail');
        return;
      }
      if (uniqueTargets.length === 1) {
        const onlyTarget = uniqueTargets[0] as string;
        setSelectedTarget(onlyTarget);
        setFilters(prev => ({ ...prev, selectedTarget: onlyTarget }));
        setCurrentView('detail');
        return;
      }
    } catch {
      // Fallback to target view if any error occurs while checking
    }
    setCurrentView('target');
  };

  const handleTargetClick = (target: string) => {
    setSelectedTarget(target);
    setFilters(prev => ({ ...prev, selectedTarget: target, statusFilters: [] }));
    setCurrentView('detail');
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

  // Back navigation helpers (pure in lib/navigation)
  

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
  const stats = calculateSummary(filteredData);

  // Contextual KPIs for the header depending on current view
  let contextAverage: number | undefined = undefined;
  let contextTotal: number | undefined = undefined;
  let contextPassed: number | undefined = undefined;
  let contextTotalLabel: string | undefined = undefined;

  if (currentView === 'main') {
    const dataForGroup = filteredData.filter(
      i => i['ประเด็นขับเคลื่อน'] === selectedGroup
    );
    const byMain: Record<string, KPIRecord[]> = {};
    dataForGroup.forEach(i => {
      const main = i['ตัวชี้วัดหลัก'];
      if (!byMain[main]) byMain[main] = [] as KPIRecord[];
      byMain[main].push(i);
    });

    const perMainAverages: number[] = Object.values(byMain).map(records => {
      const bySub: Record<string, KPIRecord[]> = {};
      records.forEach(r => {
        const sub = r['ตัวชี้วัดย่อย'];
        if (!bySub[sub]) bySub[sub] = [] as KPIRecord[];
        bySub[sub].push(r);
      });
      const subAverages: number[] = Object.values(bySub).map(recs => {
        const vals: number[] = [];
        recs.forEach(rr => {
          const p = calculatePercentage(rr);
          const hasResult = rr['ผลงาน']?.toString().trim() !== '';
          if (p !== null && hasResult) vals.push(p);
        });
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      if (subAverages.length === 0) return 0;
      return subAverages.reduce((a, b) => a + b, 0) / subAverages.length;
    });

    if (perMainAverages.length > 0) {
      contextAverage = perMainAverages.reduce((a, b) => a + b, 0) / perMainAverages.length;
    } else {
      contextAverage = 0;
    }

    // Context pass/fail at main level: a main passes only if all sub-KPIs pass their thresholds
    const mainPassFlags: boolean[] = Object.values(byMain).map(records => {
      const bySub: Record<string, KPIRecord[]> = {};
      records.forEach(r => {
        const sub = r['ตัวชี้วัดย่อย'];
        if (!bySub[sub]) bySub[sub] = [] as KPIRecord[];
        bySub[sub].push(r);
      });
      const subStatuses = Object.values(bySub).map(recs => {
        const vals: number[] = [];
        recs.forEach(rr => {
          const p = calculatePercentage(rr);
          const hasResult = rr['ผลงาน']?.toString().trim() !== '';
          if (p !== null && hasResult) vals.push(p);
        });
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const th = parseFloat(recs[0]['เกณฑ์ผ่าน (%)']?.toString() || '0');
        return avg >= th;
      });
      return subStatuses.length > 0 && subStatuses.every(Boolean);
    });
    contextTotal = mainPassFlags.length;
    contextPassed = mainPassFlags.filter(Boolean).length;
    contextTotalLabel = 'ตัวชี้วัดหลัก';
  } else if (currentView === 'sub') {
    const dataForMain = filteredData.filter(
      i => i['ประเด็นขับเคลื่อน'] === selectedGroup && i['ตัวชี้วัดหลัก'] === selectedMainKPI
    );
    const bySub: Record<string, KPIRecord[]> = {};
    dataForMain.forEach(i => {
      const sub = i['ตัวชี้วัดย่อย'];
      if (!bySub[sub]) bySub[sub] = [] as KPIRecord[];
      bySub[sub].push(i);
    });
    // Average each sub-KPI across its rows (valid results only)
    const subAverages: number[] = Object.values(bySub).map(recs => {
      const vals: number[] = [];
      recs.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = r['ผลงาน']?.toString().trim() !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    contextAverage = subAverages.length > 0 ? subAverages.reduce((a, b) => a + b, 0) / subAverages.length : 0;

    // Context pass/fail at sub level: pass if average across rows >= threshold
    const subPassFlags = Object.values(bySub).map(recs => {
      const vals: number[] = [];
      recs.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = r['ผลงาน']?.toString().trim() !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const th = parseFloat(recs[0]['เกณฑ์ผ่าน (%)']?.toString() || '0');
      return avg >= th;
    });
    contextTotal = subPassFlags.length;
    contextPassed = subPassFlags.filter(Boolean).length;
    contextTotalLabel = 'ตัวชี้วัดย่อย';
  } else if (currentView === 'target') {
    const dataForTargetView = filteredData.filter(
      i => i['ประเด็นขับเคลื่อน'] === selectedGroup && i['ตัวชี้วัดหลัก'] === selectedMainKPI && (!selectedSubKPI || i['ตัวชี้วัดย่อย'] === selectedSubKPI)
    );
    const byTarget: Record<string, KPIRecord[]> = {};
    dataForTargetView.forEach(i => {
      const tgt = i['กลุ่มเป้าหมาย'];
      if (!byTarget[tgt]) byTarget[tgt] = [] as KPIRecord[];
      byTarget[tgt].push(i);
    });
    // Average per target across its rows (valid results only)
    const targetAverages: number[] = Object.values(byTarget).map(recs => {
      const vals: number[] = [];
      recs.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = r['ผลงาน']?.toString().trim() !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    contextAverage = targetAverages.length > 0 ? targetAverages.reduce((a, b) => a + b, 0) / targetAverages.length : 0;

    // Context pass/fail at target level: target passes if its first-row percentage >= its threshold
    const targetPassFlags = Object.values(byTarget).map(recs => {
      const vals: number[] = [];
      recs.forEach(r => {
        const p = calculatePercentage(r);
        const hasResult = r['ผลงาน']?.toString().trim() !== '';
        if (p !== null && hasResult) vals.push(p);
      });
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const th = parseFloat(recs[0]['เกณฑ์ผ่าน (%)']?.toString() || '0');
      return avg >= th;
    });
    contextTotal = targetPassFlags.length;
    contextPassed = targetPassFlags.filter(Boolean).length;
    contextTotalLabel = 'กลุ่มเป้าหมาย';
  } else if (currentView === 'detail') {
    const dataForDetail = filteredData.filter(
      i => (!selectedGroup || i['ประเด็นขับเคลื่อน'] === selectedGroup) && (!selectedMainKPI || i['ตัวชี้วัดหลัก'] === selectedMainKPI) && (!selectedSubKPI || i['ตัวชี้วัดย่อย'] === selectedSubKPI) && (!selectedTarget || i['กลุ่มเป้าหมาย'] === selectedTarget)
    );
    const validPercents: number[] = [];
    dataForDetail.forEach(r => {
      const p = calculatePercentage(r);
      const res = r['ผลงาน']?.toString().trim();
      if (p === null || !res) return;
      validPercents.push(p);
    });
    contextAverage = validPercents.length > 0 ? validPercents.reduce((a, b) => a + b, 0) / validPercents.length : 0;

    // Context pass/fail at detail level: count per row with valid result
    let passed = 0;
    let total = 0;
    dataForDetail.forEach(rec => {
      const res = rec['ผลงาน']?.toString().trim();
      const p = calculatePercentage(rec);
      if (p === null || !res) return;
      total++;
      const th = parseFloat(rec['เกณฑ์ผ่าน (%)']?.toString() || '0');
      if (p >= th) passed++;
    });
    contextTotal = total;
    contextPassed = passed;
    contextTotalLabel = 'หน่วยบริการ';
  } else if (currentView === 'groups') {
    // Override label and counts to reflect group-level aggregation
    contextTotalLabel = 'ประเด็นขับเคลื่อนหลัก';
    const groupStats = stats.groupStats;
    const groupEntries = Object.values(groupStats);
    const groupAverages = groupEntries.map(g => g.averagePercentage);
    contextAverage = groupAverages.length > 0
      ? groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length
      : 0;
    contextTotal = groupEntries.length;
    // Pass criteria at group level: absolute status using averagePercentage
    const passedGroups = groupAverages.filter(avg => getAbsoluteStatus(avg) === 'passed').length;
    contextPassed = passedGroups;
  }
  // Legacy aliases for components expecting global summary objects
  if (typeof window !== "undefined") {
    const legacy = window as unknown as Record<string, unknown>;
    legacy.summary = stats;
    legacy.filteredSummary = stats;
    // Provide a stub for legacy code expecting a global groupIcon reference
    if (legacy.groupIcon === undefined) {
      legacy.groupIcon = () => null;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader 
          stats={stats} 
          contextAverage={contextAverage} 
          contextTotal={contextTotal}
          contextPassed={contextPassed}
          contextTotalLabel={contextTotalLabel}
        />

        {/* Filter Panel */}
        <FilterPanel 
          data={allData.configuration}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Main Content */}
        {currentView === 'groups' && (
          <KPIGroupCards
            data={filteredData}
            stats={stats}
            onGroupClick={handleGroupClick}
          />
        )}
        {currentView === 'main' && (
          <MainKPICards
            data={filteredData.filter(i => i['ประเด็นขับเคลื่อน'] === selectedGroup)}
            groupName={selectedGroup}
            groupIcon={selectedGroupIcon ?? undefined}
            onBack={handleBackToGroups}
            onMainKPIClick={handleMainKPIClick}
          />
        )}
        {currentView === 'sub' && (
          <SubKPICards
            data={filteredData.filter(i => i['ประเด็นขับเคลื่อน'] === selectedGroup && i['ตัวชี้วัดหลัก'] === selectedMainKPI)}
            groupName={selectedGroup}
            mainKPIName={selectedMainKPI}
            groupIcon={selectedGroupIcon ?? undefined}
            onBack={handleBackToMain}
            onNavigateToGroups={handleBackToGroups}
            onSubKPIClick={handleSubKPIClick}
          />
        )}
        {currentView === 'target' && (() => {
          const backLevel = deriveBackLevelFromTarget(allData?.configuration ?? [], selectedGroup, selectedMainKPI);
          const onBackFn = backLevel === 'sub' ? handleBackToSub : handleBackToMain;
          return (
            <TargetCards
              data={filteredData.filter(i => i['ประเด็นขับเคลื่อน'] === selectedGroup && i['ตัวชี้วัดหลัก'] === selectedMainKPI && (!selectedSubKPI || i['ตัวชี้วัดย่อย'] === selectedSubKPI))}
              groupName={selectedGroup}
              mainKPIName={selectedMainKPI}
              subKPIName={selectedSubKPI}
              groupIcon={selectedGroupIcon ?? undefined}
              onBack={onBackFn}
              onNavigateToGroups={handleBackToGroups}
              onNavigateToMain={handleBackToMain}
              onNavigateToSub={backLevel === 'sub' ? handleBackToSub : undefined}
              onTargetClick={handleTargetClick}
            />
          );
        })()}
        {currentView === 'detail' && (() => {
          const dataForDetail = filteredData.filter(i => (!selectedGroup || i['ประเด็นขับเคลื่อน'] === selectedGroup) && (!selectedMainKPI || i['ตัวชี้วัดหลัก'] === selectedMainKPI) && (!selectedSubKPI || i['ตัวชี้วัดย่อย'] === selectedSubKPI) && (!selectedTarget || i['กลุ่มเป้าหมาย'] === selectedTarget));
          const backLevel = deriveBackLevelFromDetail(allData?.configuration ?? [], selectedGroup, selectedMainKPI, selectedSubKPI || undefined);
          const onBackFn = backLevel === 'target' ? handleBackToTarget : backLevel === 'sub' ? handleBackToSub : handleBackToMain;
          return (
            <KPIDetailTable
              data={dataForDetail}
              groupName={selectedGroup}
              groupIcon={selectedGroupIcon ?? undefined}
              mainKPIName={selectedMainKPI}
              subKPIName={selectedSubKPI}
              targetName={selectedTarget}
              onBack={onBackFn}
              onNavigateToGroup={handleBackToMain}
              onNavigateToMain={handleBackToSub}
              onNavigateToSub={handleBackToTarget}
              onKPIInfoClick={handleKPIInfoClick}
              onRawDataClick={handleRawDataClick}
            />
          );
        })()}

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
