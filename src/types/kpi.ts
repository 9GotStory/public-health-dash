export interface KPIRecord {
  'ประเด็นขับเคลื่อน': string;
  'กลุ่มงานย่อย': string;
  'ตัวชี้วัดหลัก': string;
  'ตัวชี้วัดย่อย': string;
  'กลุ่มเป้าหมาย': string;
  'ชื่อหน่วยบริการ': string;
  'เป้าหมาย': number | string;
  'ผลงาน': number | string;
  'ร้อยละ (%)': number | string;
  'เกณฑ์ผ่าน (%)': number | string;
  'ข้อมูลวันที่': string;
  'sheet_source': string;
  'service_code_ref': string;
  'kpi_info_id': string;
}

export interface KPIInfo {
  kpi_info_id: string;
  'ประเด็นขับเคลื่อน': string;
  'กลุ่มงานย่อย': string;
  'ตัวชี้วัดหลัก': string;
  'ตัวชี้วัดย่อย': string;
  'กลุ่มเป้าหมาย': string;
  'คำนิยาม': string;
  'เกณฑ์เป้าหมาย': string;
  'ประชากรกลุ่มเป้าหมาย': string;
  'วิธีการจัดเก็บข้อมูล': string;
  'แหล่งข้อมูล': string;
  'รายการข้อมูล_1': string;
  'รายการข้อมูล_2': string;
  'รายการข้อมูล_3': string;
  'รายการข้อมูล_4': string;
  'รายการข้อมูล_5': string;
  'สูตรการคำนวณ': string;
  'เอกสารสนับสนุน': string;
  'หน่วยงานรับผิดชอบ': string;
  'ผู้ประสานงาน': string;
  'แหล่งอ้างอิง': string;
  'หมายเหตุ': string;
  'สถานะใช้งาน': string;
  'วันที่สร้าง': string;
  'วันที่แก้ไขล่าสุด': string;
}

export interface SummaryStats {
  totalKPIs: number;
  averagePercentage: number;
  passedKPIs: number;
  failedKPIs: number;
  groupStats: {
    [key: string]: {
      count: number;
      totalPercentage: number;
      passed: number;
      failed: number;
      averagePercentage: number;
    }
  }
}

export interface KPIData {
  configuration: KPIRecord[];
  sourceData: { [key: string]: any[] };
  groups: string[];
  summary: SummaryStats;
  metadata?: {
    totalKPIs: number;
    totalSheets: number;
    lastUpdate: string;
  }
}

export interface APIResponse<T> {
  status: 'success' | 'error';
  timestamp: string;
  version?: string;
  message?: string;
  data: T | null;
}

export interface FilterState {
  searchTerm: string;
  selectedGroup: string;
  selectedMainKPI: string;
  selectedSubKPI: string;
  selectedTarget: string;
  selectedService: string;
}