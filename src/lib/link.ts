import { FilterState, KPIRecord } from "@/types/kpi";

// Base64URL helpers that support UTF-8
const toBase64Url = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (b64url: string): string => {
  let base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

type ShortFilters = {
  g?: string; // group
  m?: string; // main
  s?: string; // sub
  t?: string; // target
  v?: string; // service
  st?: string[]; // status filters
};

export const encodeFiltersToShortToken = (filters: FilterState): string => {
  const payload: ShortFilters = {};
  if (filters.selectedGroup) payload.g = filters.selectedGroup;
  if (filters.selectedMainKPI) payload.m = filters.selectedMainKPI;
  if (filters.selectedSubKPI) payload.s = filters.selectedSubKPI;
  if (filters.selectedTarget) payload.t = filters.selectedTarget;
  if (filters.selectedService) payload.v = filters.selectedService;
  if (filters.statusFilters && filters.statusFilters.length > 0)
    payload.st = filters.statusFilters;
  return toBase64Url(JSON.stringify(payload));
};

export const decodeFiltersFromShortToken = (token: string): FilterState | null => {
  try {
    const json = fromBase64Url(token);
    const obj = JSON.parse(json) as ShortFilters;
    const status = Array.isArray(obj.st)
      ? obj.st
      : typeof (obj as any).st === "string"
        ? ((obj as any).st as string).split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    const result: FilterState = {
      selectedGroup: obj.g || "",
      selectedMainKPI: obj.m || "",
      selectedSubKPI: obj.s || "",
      selectedTarget: obj.t || "",
      selectedService: obj.v || "",
      statusFilters: status as FilterState["statusFilters"],
    };
    return result;
  } catch {
    return null;
  }
};

// Extra-short index-based token using dataset-derived dictionaries
// Token format (ascii, base36 indices): g.m.s.t.v.b
// - g: group index in unique groups
// - m: main index within selected group
// - s: sub index within selected group+main (optional)
// - t: target index within (group+main+sub) if sub selected, otherwise (group+main)
// - v: service index in unique services
// - b: status bitmask (bit0=passed, bit1=near, bit2=failed)
// Empty segment means not set. Trailing empty segments may be omitted.

const toB36 = (n: number) => n.toString(36);
const fromB36 = (s: string) => parseInt(s, 36);

const uniq = (arr: (string | undefined | null)[]) => {
  const items = Array.from(new Set(arr.map(v => (v ?? '').toString().trim()).filter(Boolean))) as string[];
  return items.sort((a, b) => a.localeCompare(b));
};

export const buildDictionaries = (data: KPIRecord[]) => {
  const groups = uniq(data.map(i => i['ประเด็นขับเคลื่อน']));
  const services = uniq(data.map(i => i['ชื่อหน่วยบริการ']));
  const mainsByGroup: Record<string, string[]> = {};
  const subsByGM: Record<string, string[]> = {};
  const targetsByGMS: Record<string, string[]> = {};

  groups.forEach(g => {
    const inG = data.filter(i => i['ประเด็นขับเคลื่อน'] === g);
    mainsByGroup[g] = uniq(inG.map(i => i['ตัวชี้วัดหลัก']));
    mainsByGroup[g].forEach(m => {
      const inGM = inG.filter(i => i['ตัวชี้วัดหลัก'] === m);
      const subs = uniq(inGM.map(i => i['ตัวชี้วัดย่อย']));
      subsByGM[`${g}\u0001${m}`] = subs;
      if (subs.length > 0) {
        subs.forEach(s => {
          const inGMS = inGM.filter(i => i['ตัวชี้วัดย่อย'] === s);
          targetsByGMS[`${g}\u0001${m}\u0001${s}`] = uniq(inGMS.map(i => i['กลุ่มเป้าหมาย']));
        });
      }
      // Also compute targets with no sub selected (for main level)
      targetsByGMS[`${g}\u0001${m}\u0001`] = uniq(inGM.map(i => i['กลุ่มเป้าหมาย']));
    });
  });

  return { groups, services, mainsByGroup, subsByGM, targetsByGMS };
};

const djb2 = (s: string) => {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
};

export const getDictionaryHash = (data: KPIRecord[]) => {
  const { groups, services, mainsByGroup, subsByGM, targetsByGMS } = buildDictionaries(data);
  const parts: string[] = [];
  parts.push('g:' + groups.join('|'));
  const gSorted = [...groups].sort((a, b) => a.localeCompare(b));
  gSorted.forEach(g => {
    const mains = (mainsByGroup[g] || []).slice().sort((a, b) => a.localeCompare(b));
    parts.push('m:' + g + ':' + mains.join('|'));
    mains.forEach(m => {
      const subs = (subsByGM[`${g}\u0001${m}`] || []).slice().sort((a, b) => a.localeCompare(b));
      parts.push('s:' + g + '|' + m + ':' + subs.join('|'));
      const tWithSub = (targetsByGMS[`${g}\u0001${m}\u0001${subs[0] || ''}`] || []).slice().sort((a, b) => a.localeCompare(b));
      // We don't know all sub targets here cheaply; include no-sub targets for stability
      const tNoSub = (targetsByGMS[`${g}\u0001${m}\u0001`] || []).slice().sort((a, b) => a.localeCompare(b));
      parts.push('tN:' + g + '|' + m + ':' + tNoSub.join('|'));
      if (tWithSub.length) parts.push('tS:' + g + '|' + m + ':' + tWithSub.join('|'));
    });
  });
  parts.push('v:' + services.join('|'));
  const fp = parts.join('||');
  return djb2(fp).toString(36);
};

type ViewLong = 'groups' | 'main' | 'sub' | 'target' | 'detail';
type ViewCode = 'g' | 'm' | 's' | 't' | 'd';
const toViewCode = (v?: string | null): ViewCode | '' => {
  if (!v) return '';
  switch (v) {
    case 'groups':
    case 'g':
      return 'g';
    case 'main':
    case 'm':
      return 'm';
    case 'sub':
    case 's':
      return 's';
    case 'target':
    case 't':
      return 't';
    case 'detail':
    case 'd':
      return 'd';
    default:
      return '';
  }
};
const fromViewCode = (c?: string | null): ViewLong | undefined => {
  switch (c) {
    case 'g':
      return 'groups';
    case 'm':
      return 'main';
    case 's':
      return 'sub';
    case 't':
      return 'target';
    case 'd':
      return 'detail';
    default:
      return undefined;
  }
};

export const encodeFiltersToIndexToken = (data: KPIRecord[], filters: FilterState, view?: ViewLong | ViewCode): string => {
  const { groups, services, mainsByGroup, subsByGM, targetsByGMS } = buildDictionaries(data);
  const gIdx = filters.selectedGroup ? groups.indexOf(filters.selectedGroup) : -1;
  const mIdx = filters.selectedMainKPI && gIdx >= 0
    ? (mainsByGroup[filters.selectedGroup] || []).indexOf(filters.selectedMainKPI)
    : -1;
  const sIdx = filters.selectedSubKPI && gIdx >= 0 && mIdx >= 0
    ? (subsByGM[`${filters.selectedGroup}\u0001${filters.selectedMainKPI}`] || []).indexOf(filters.selectedSubKPI)
    : -1;
  const tKey = `${filters.selectedGroup}\u0001${filters.selectedMainKPI}\u0001${filters.selectedSubKPI || ''}`;
  const tIdx = filters.selectedTarget && gIdx >= 0 && mIdx >= 0
    ? (targetsByGMS[tKey] || []).indexOf(filters.selectedTarget)
    : -1;
  const vIdx = filters.selectedService ? services.indexOf(filters.selectedService) : -1;
  let b = 0;
  if (filters.statusFilters?.includes('passed')) b |= 1;
  if (filters.statusFilters?.includes('near')) b |= 2;
  if (filters.statusFilters?.includes('failed')) b |= 4;

  const parts: string[] = [];
  const push = (n: number) => { if (n >= 0) parts.push(toB36(n)); else parts.push(''); };
  push(gIdx); push(mIdx); push(sIdx); push(tIdx); push(vIdx); parts.push(b ? toB36(b) : '');
  // Trim trailing empties
  let end = parts.length - 1;
  while (end >= 0 && parts[end] === '') end--;
  const bodyCore = parts.slice(0, end + 1).join('.');
  const viewCode = toViewCode(view);
  const body = viewCode ? `${bodyCore}.${viewCode}` : bodyCore;
  const version = '1';
  const dictHash = getDictionaryHash(data);
  return `${version}-${dictHash}.${body}`;
};

export const decodeFiltersFromIndexToken = (data: KPIRecord[], token: string): { filters: FilterState; view?: ViewLong } | null => {
  try {
    const { groups, services, mainsByGroup, subsByGM, targetsByGMS } = buildDictionaries(data);
    let segs = token.split('.');
    if (segs.length > 0 && /^(\d+)-([A-Za-z0-9]+)$/.test(segs[0])) {
      const m = segs[0].match(/^(\d+)-([A-Za-z0-9]+)$/)!;
      const ver = m[1];
      const hash = m[2];
      if (ver !== '1') return null;
      const currentHash = getDictionaryHash(data);
      if (hash !== currentHash) return null;
      segs = segs.slice(1);
    }
    const val = (i: number) => (i < segs.length && segs[i] !== '' ? fromB36(segs[i]) : -1);
    const sval = (i: number) => (i < segs.length ? segs[i] : '');
    const gIdx = val(0);
    const group = gIdx >= 0 ? groups[gIdx] : '';
    const mIdx = val(1);
    const mains = group ? (mainsByGroup[group] || []) : [];
    const main = mIdx >= 0 ? (mains[mIdx] || '') : '';
    const sIdx = val(2);
    const subs = group && main ? (subsByGM[`${group}\u0001${main}`] || []) : [];
    const sub = sIdx >= 0 ? (subs[sIdx] || '') : '';
    const tIdx = val(3);
    const tKey = `${group}\u0001${main}\u0001${sub || ''}`;
    const targets = (targetsByGMS[tKey] || []);
    const target = tIdx >= 0 ? (targets[tIdx] || '') : '';
    const vIdx = val(4);
    const service = vIdx >= 0 ? (services[vIdx] || '') : '';
    const b = val(5);
    const vcode = sval(6);
    const status: FilterState['statusFilters'] = [];
    if (b >= 0) {
      if (b & 1) status.push('passed');
      if (b & 2) status.push('near');
      if (b & 4) status.push('failed');
    }
    return {
      filters: {
        selectedGroup: group || '',
        selectedMainKPI: main || '',
        selectedSubKPI: sub || '',
        selectedTarget: target || '',
        selectedService: service || '',
        statusFilters: status,
      },
      view: fromViewCode(vcode),
    };
  } catch {
    return null;
  }
};
