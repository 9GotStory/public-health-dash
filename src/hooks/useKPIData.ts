import { useState, useEffect } from 'react';
import { KPIData, KPIRecord, KPIInfo, APIResponse } from '@/types/kpi';

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwTCVRGkFte39699yAHm5d1suYsU9RUFM8mjtoohhj5uBWfHKsRkSI3MVbRJyw4oU_YKQ/exec';

export const useKPIData = () => {
  const [allData, setAllData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}?action=getAllKPIData`);
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
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
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
  const [kpiInfo, setKpiInfo] = useState<any>(null);
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
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: APIResponse<any> = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล KPI Info');
      }
      
      setKpiInfo(result.data);
    } catch (err) {
      console.error('Error fetching KPI info:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล KPI Info');
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
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSourceData = async (sheetName: string) => {
    if (!sheetName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}?action=getSourceSheetData&param=${encodeURIComponent(sheetName)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: APIResponse<any[]> = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลต้นฉบับ');
      }
      
      setSourceData(result.data || []);
    } catch (err) {
      console.error('Error fetching source data:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลต้นฉบับ');
    } finally {
      setLoading(false);
    }
  };

  return {
    sourceData,
    loading,
    error,
    fetchSourceData
  };
};