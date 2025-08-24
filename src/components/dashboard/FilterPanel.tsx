import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Filter } from "lucide-react";
import { KPIRecord, FilterState } from "@/types/kpi";

interface FilterPanelProps {
  data: KPIRecord[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterPanel = ({ data, filters, onFiltersChange }: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build cascading filter options based on current selections
  const filteredByGroup = filters.selectedGroup
    ? data.filter(item => item['ประเด็นขับเคลื่อน'] === filters.selectedGroup)
    : data;
  const filteredByMainKPI = filters.selectedMainKPI
    ? filteredByGroup.filter(item => item['ตัวชี้วัดหลัก'] === filters.selectedMainKPI)
    : filteredByGroup;
  const filteredBySubKPI = filters.selectedSubKPI
    ? filteredByMainKPI.filter(item => item['ตัวชี้วัดย่อย'] === filters.selectedSubKPI)
    : filteredByMainKPI;
  const filteredByTarget = filters.selectedTarget
    ? filteredBySubKPI.filter(item => item['กลุ่มเป้าหมาย'] === filters.selectedTarget)
    : filteredBySubKPI;

  const uniqueGroups = [
    ...new Set(data.map(item => item['ประเด็นขับเคลื่อน']).filter(Boolean))
  ];
  const uniqueMainKPIs = [
    ...new Set(filteredByGroup.map(item => item['ตัวชี้วัดหลัก']).filter(Boolean))
  ];
  const uniqueSubKPIs = [
    ...new Set(filteredByMainKPI.map(item => item['ตัวชี้วัดย่อย']).filter(Boolean))
  ];
  const uniqueTargets = [
    ...new Set(filteredBySubKPI.map(item => item['กลุ่มเป้าหมาย']).filter(Boolean))
  ];
  const uniqueServices = [
    ...new Set(filteredByTarget.map(item => item['ชื่อหน่วยบริการ']).filter(Boolean))
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const updated: FilterState = {
      ...filters,
      [key]: value
    };

    // Reset dependent filters when parent selection changes
    if (key === "selectedGroup") {
      updated.selectedMainKPI = "";
      updated.selectedSubKPI = "";
      updated.selectedTarget = "";
      updated.selectedService = "";
    } else if (key === "selectedMainKPI") {
      updated.selectedSubKPI = "";
      updated.selectedTarget = "";
      updated.selectedService = "";
    } else if (key === "selectedSubKPI") {
      updated.selectedTarget = "";
      updated.selectedService = "";
    } else if (key === "selectedTarget") {
      updated.selectedService = "";
    }

    onFiltersChange(updated);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const updated: FilterState = {
      ...filters,
      statusFilters: checked
        ? [...filters.statusFilters, status]
        : filters.statusFilters.filter(s => s !== status)
    };
    onFiltersChange(updated);
  };

  const resetFilters = () => {
    onFiltersChange({
      selectedGroup: "",
      selectedMainKPI: "",
      selectedSubKPI: "",
      selectedTarget: "",
      selectedService: "",
      statusFilters: []
    });
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    Array.isArray(value) ? value.length > 0 : value !== ""
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">ตัวกรองข้อมูล</h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              ล้างตัวกรอง
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'ย่อ' : 'ขยาย'}
          </Button>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              ประเด็นขับเคลื่อน
            </label>
            <Select 
              value={filters.selectedGroup} 
              onValueChange={(value) => handleFilterChange('selectedGroup', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเด็นขับเคลื่อน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniqueGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              ตัวชี้วัดหลัก
            </label>
            <Select 
              value={filters.selectedMainKPI} 
              onValueChange={(value) => handleFilterChange('selectedMainKPI', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกตัวชี้วัดหลัก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniqueMainKPIs.map(kpi => (
                  <SelectItem key={kpi} value={kpi}>{kpi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              ตัวชี้วัดย่อย
            </label>
            <Select 
              value={filters.selectedSubKPI} 
              onValueChange={(value) => handleFilterChange('selectedSubKPI', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกตัวชี้วัดย่อย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniqueSubKPIs.map(kpi => (
                  <SelectItem key={kpi} value={kpi}>{kpi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              กลุ่มเป้าหมาย
            </label>
            <Select 
              value={filters.selectedTarget} 
              onValueChange={(value) => handleFilterChange('selectedTarget', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกกลุ่มเป้าหมาย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniqueTargets.map(target => (
                  <SelectItem key={target} value={target}>{target}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              หน่วยบริการ
            </label>
            <Select
              value={filters.selectedService}
              onValueChange={(value) => handleFilterChange("selectedService", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหน่วยบริการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniqueServices.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              สถานะ
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.statusFilters.includes('passed')}
                  onCheckedChange={checked => handleStatusChange('passed', checked as boolean)}
                />
                <span>ผ่าน</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.statusFilters.includes('near')}
                  onCheckedChange={checked => handleStatusChange('near', checked as boolean)}
                />
                <span>ใกล้เป้า</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.statusFilters.includes('failed')}
                  onCheckedChange={checked => handleStatusChange('failed', checked as boolean)}
                />
                <span>ไม่ผ่าน</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.selectedGroup && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                ประเด็น: {filters.selectedGroup}
              </span>
            )}
            {filters.selectedMainKPI && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                ตัวชี้วัดหลัก: {filters.selectedMainKPI}
              </span>
            )}
            {filters.selectedSubKPI && (
              <span className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                ตัวชี้วัดย่อย: {filters.selectedSubKPI}
              </span>
            )}
            {filters.selectedTarget && (
              <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                เป้าหมาย: {filters.selectedTarget}
              </span>
            )}
            {filters.selectedService && (
              <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                หน่วยบริการ: {filters.selectedService}
              </span>
            )}
            {filters.statusFilters.includes('passed') && (
              <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full">
                สถานะ: ผ่าน
              </span>
            )}
            {filters.statusFilters.includes('near') && (
              <span className="px-3 py-1 bg-warning/10 text-warning text-sm rounded-full">
                สถานะ: ใกล้เป้า
              </span>
            )}
            {filters.statusFilters.includes('failed') && (
              <span className="px-3 py-1 bg-destructive/10 text-destructive text-sm rounded-full">
                สถานะ: ไม่ผ่าน
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};