import { useState, useEffect, useCallback } from 'react';
import { KPIData, KPIRecord, KPIInfo, APIResponse } from '@/types/kpi';
import { ApiResponseSchema, KPIDataSchema, KPIInfoSchema } from '@/lib/schema';

// Prefer env var, fall back to default for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://script.google.com/macros/s/AKfycbwTCVRGkFte39699yAHm5d1suYsU9RUFM8mjtoohhj5uBWfHKsRkSI3MVbRJyw4oU_YKQ/exec';

const isAbortError = (e: unknown): e is DOMException => e instanceof DOMException && e.name === 'AbortError';

export const useKPIData = () => {
  const [allData, setAllData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
  const fetchWithRetry = async (url: string, init?: RequestInit, retries = 2, delay = 500): Promise<Response> => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const resp = await fetch(url, { ...(init || {}), signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await sleep(delay * Math.pow(2, attempt));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Network error');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithRetry(`${API_BASE_URL}?action=getAllKPIData`);
      const json = await response.json();
      const parsed = ApiResponseSchema(KPIDataSchema).safeParse(json);
      if (!parsed.success || parsed.data.status === 'error' || !parsed.data.data) {
        throw new Error(parsed.success ? (parsed.data.message || 'รูปแบบข้อมูลไม่ถูกต้อง') : parsed.error.message);
      }
      setAllData(parsed.data.data as KPIData);
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
      let url = `${API_BASE_URL}?action=getKPIInfoByGroup`;
      if (id) {
        url += `&kpi_info_id=${encodeURIComponent(id)}`;
      } else if (group) {
        url += `&param=${encodeURIComponent(group)}`;
      }

      const response = await fetchWithRetry(url);
      const json = await response.json();
      const parsed = ApiResponseSchema(KPIInfoSchema).safeParse(json);
      if (!parsed.success || parsed.data.status === 'error') {
        throw new Error(parsed.success ? (parsed.data.message || 'รูปแบบข้อมูลไม่ถูกต้อง') : parsed.error.message);
      }
      setKpiInfo(parsed.data.data as KPIInfo);
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
