import { useState, useEffect, useCallback } from 'react';
import { KPIData, KPIRecord, KPIInfo, APIResponse } from '@/types/kpi';

// Prefer env var, fall back to default for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://script.google.com/macros/s/AKfycbwTCVRGkFte39699yAHm5d1suYsU9RUFM8mjtoohhj5uBWfHKsRkSI3MVbRJyw4oU_YKQ/exec';

const isAbortError = (e: unknown): e is DOMException => e instanceof DOMException && e.name === 'AbortError';

export const useKPIData = () => {
  const [allData, setAllData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      const response = await fetch(`${API_BASE_URL}?action=getAllKPIData`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: APIResponse<KPIData> = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
      
      setAllData(result.data);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      if (!isAbortError(err)) setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    allData,
    loading,
    error,
    refetch: fetchData
  };
};

export const useKPIInfo = (groupName?: string, kpiInfoId?: string) => {
  const [kpiInfo, setKpiInfo] = useState<KPIInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIInfo = async (group?: string, id?: string) => {
    if (!group && !id) return;
    
    try {
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      let url = `${API_BASE_URL}?action=getKPIInfoByGroup`;
      if (id) {
        url += `&kpi_info_id=${encodeURIComponent(id)}`;
      } else if (group) {
        url += `&param=${encodeURIComponent(group)}`;
      }
      
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: APIResponse<KPIInfo> = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล KPI Info');
      }
      
      setKpiInfo(result.data);
    } catch (err) {
      console.error('Error fetching KPI info:', err);
      if (!isAbortError(err)) setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล KPI Info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIInfo(groupName, kpiInfoId);
  }, [groupName, kpiInfoId]);

  return {
    kpiInfo,
    loading,
    error,
    fetchKPIInfo
  };
};

export const useSourceData = () => {
  const [sourceData, setSourceData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSourceData = useCallback(async (sheetName: string) => {
    if (!sheetName) return;

    try {
      setLoading(true);
      setError(null);
      setSourceData([]);

      const controller = new AbortController();
      const response = await fetch(`${API_BASE_URL}?action=getSourceSheetData&param=${encodeURIComponent(sheetName)}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: APIResponse<Record<string, unknown>[]> = await response.json();
      if (result.status === 'error') {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลต้นฉบับ');
      }

      if (!Array.isArray(result.data)) {
        throw new Error('รูปแบบข้อมูลต้นฉบับไม่ถูกต้อง');
      }

      setSourceData(result.data);
    } catch (err) {
      console.error('Error fetching source data:', err);
      if (!isAbortError(err)) setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลต้นฉบับ');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sourceData,
    loading,
    error,
    fetchSourceData,
  };
};
