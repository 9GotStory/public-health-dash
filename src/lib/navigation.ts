import { KPIRecord } from "@/types/kpi";
import { F } from "./fields";
import { getStr } from "./data";

export type BackLevel = 'main' | 'sub' | 'target';

export const deriveBackLevelFromTarget = (
  allData: KPIRecord[],
  selectedGroup: string,
  selectedMainKPI: string
): BackLevel => {
  const hasAnySubForCurrentMain = allData
    .filter(i => getStr(i, F.GROUP) === selectedGroup && getStr(i, F.MAIN) === selectedMainKPI)
    .some(i => getStr(i, F.SUB) !== '');
  return hasAnySubForCurrentMain ? 'sub' : 'main';
};

export const deriveBackLevelFromDetail = (
  allData: KPIRecord[],
  selectedGroup: string,
  selectedMainKPI: string,
  selectedSubKPI?: string | null,
): BackLevel => {
  const baseScope = allData.filter(i => getStr(i, F.GROUP) === selectedGroup && getStr(i, F.MAIN) === selectedMainKPI && (!selectedSubKPI || getStr(i, F.SUB) === selectedSubKPI));
  const hasTargetsDim = baseScope.some(i => getStr(i, F.TARGET) !== '');
  if (hasTargetsDim) return 'target';

  const hasSubsDim = allData
    .filter(i => getStr(i, F.GROUP) === selectedGroup && getStr(i, F.MAIN) === selectedMainKPI)
    .some(i => getStr(i, F.SUB) !== '');
  return hasSubsDim ? 'sub' : 'main';
};

