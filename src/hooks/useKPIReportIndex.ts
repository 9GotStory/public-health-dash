import { useEffect, useState } from 'react';

export interface KPIReportItem {
  id: string;
  path: string;
}

export function useKPIReportIndex() {
  const [items, setItems] = useState<KPIReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Respect Vite base path both in dev and production (e.g., /public-health-dash/)
      const base: string = (import.meta as any)?.env?.BASE_URL || '/';
      const baseUrl = base.endsWith('/') ? base : base + '/';
      const indexUrl = baseUrl + 'reports/kpi/index.json';
      const res = await fetch(indexUrl, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as KPIReportItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load index');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { items, loading, error, refetch: load };
}
