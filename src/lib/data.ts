import { KPIRecord } from "@/types/kpi";
import { F, FieldKey } from "./fields";

export const getStr = (r: KPIRecord | Record<string, unknown>, key: FieldKey): string => {
  const v = (r as Record<string, unknown>)[key];
  return (v?.toString().trim() ?? "");
};

export const getNum = (r: KPIRecord | Record<string, unknown>, key: FieldKey): number => {
  const s = getStr(r, key);
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};

export const getSheetSource = (r: KPIRecord): string => {
  const s1 = r.sheet_source?.toString().trim() ?? '';
  if (s1) return s1;
  return getStr(r, F.DATA_SOURCE);
};

