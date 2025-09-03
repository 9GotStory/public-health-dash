// Centralized field keys to avoid hardcoded strings throughout the app
export const F = {
  GROUP: 'ประเด็นขับเคลื่อน',
  MAIN: 'ตัวชี้วัดหลัก',
  SUB: 'ตัวชี้วัดย่อย',
  TARGET: 'กลุ่มเป้าหมาย',
  SERVICE_NAME: 'ชื่อหน่วยบริการ',
  THRESHOLD: 'เกณฑ์ผ่าน (%)',
  RESULT: 'ผลงาน',
  GOAL: 'เป้าหมาย',
  DATA_SOURCE: 'แหล่งข้อมูล',
} as const;

export type FieldKey = typeof F[keyof typeof F];

