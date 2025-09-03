import { z } from 'zod';

export const KPIRecordSchema = z.object({
  'ประเด็นขับเคลื่อน': z.string().default(''),
  'กลุ่มงานย่อย': z.string().optional().default(''),
  'ตัวชี้วัดหลัก': z.string().default(''),
  'ตัวชี้วัดย่อย': z.string().optional().default(''),
  'กลุ่มเป้าหมาย': z.string().optional().default(''),
  'ชื่อหน่วยบริการ': z.string().optional().default(''),
  'เป้าหมาย': z.union([z.number(), z.string()]).optional().default(''),
  'ผลงาน': z.union([z.number(), z.string()]).optional().default(''),
  'ร้อยละ (%)': z.union([z.number(), z.string()]).optional().default(''),
  'เกณฑ์ผ่าน (%)': z.union([z.number(), z.string()]).optional().default(''),
  'ข้อมูลวันที่': z.string().optional().default(''),
  'sheet_source': z.string().optional(),
  'แหล่งข้อมูล': z.string().optional(),
  'service_code_ref': z.union([z.string(), z.number()]).optional().transform(v => (v === undefined ? '' : String(v))),
  'kpi_info_id': z.union([z.string(), z.number()]).optional().transform(v => (v === undefined ? '' : String(v))),
});

export const KPIInfoSchema = z.object({
  kpi_info_id: z.string().optional().default(''),
  'ประเด็นขับเคลื่อน': z.string().optional().default(''),
  'กลุ่มงานย่อย': z.string().optional().default(''),
  'ตัวชี้วัดหลัก': z.string().optional().default(''),
  'ตัวชี้วัดย่อย': z.string().optional().default(''),
  'กลุ่มเป้าหมาย': z.string().optional().default(''),
  'คำนิยาม': z.string().optional().default(''),
  'เกณฑ์เป้าหมาย': z.string().optional().default(''),
  'ประชากรกลุ่มเป้าหมาย': z.string().optional().default(''),
  'วิธีการจัดเก็บข้อมูล': z.string().optional().default(''),
  'แหล่งข้อมูล': z.string().optional().default(''),
  'รายการข้อมูล_1': z.string().optional().default(''),
  'รายการข้อมูล_2': z.string().optional().default(''),
  'รายการข้อมูล_3': z.string().optional().default(''),
  'รายการข้อมูล_4': z.string().optional().default(''),
  'รายการข้อมูล_5': z.string().optional().default(''),
  'สูตรการคำนวณ': z.string().optional().default(''),
  'เอกสารสนับสนุน': z.string().optional().default(''),
  'หน่วยงานรับผิดชอบ': z.string().optional().default(''),
  'ผู้ประสานงาน': z.string().optional().default(''),
  'แหล่งอ้างอิง': z.string().optional().default(''),
  'หมายเหตุ': z.string().optional().default(''),
  'สถานะใช้งาน': z.string().optional().default(''),
  'วันที่สร้าง': z.string().optional().default(''),
  'วันที่แก้ไขล่าสุด': z.string().optional().default(''),
});

export const SummaryStatsSchema = z.object({
  totalKPIs: z.number(),
  averagePercentage: z.number(),
  passedKPIs: z.number(),
  failedKPIs: z.number(),
  groupStats: z.record(
    z.object({
      count: z.number(),
      totalPercentage: z.number(),
      passed: z.number(),
      failed: z.number(),
      averagePercentage: z.number(),
    })
  ),
});

export const KPIDataSchema = z.object({
  configuration: z.array(KPIRecordSchema),
  sourceData: z.record(z.array(z.unknown())).default({}),
  groups: z.array(z.string()).default([]),
  summary: SummaryStatsSchema,
  metadata: z
    .object({
      totalKPIs: z.number().optional(),
      totalSheets: z.number().optional(),
      lastUpdate: z.string().optional(),
    })
    .optional(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    status: z.enum(['success', 'error']),
    timestamp: z.string(),
    version: z.string().optional(),
    message: z.string().optional(),
    data: inner.nullable(),
  });
