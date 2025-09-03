import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, Cell } from 'recharts';
import { formatPercentage } from '@/lib/format';
import { getThresholdStatus } from '@/lib/kpi';

type Datum = { name: string; pct: number; threshold: number };

const colorByStatus = (pct: number, th: number) => {
  const st = getThresholdStatus(pct, th);
  if (st === 'passed') return '#16A34A'; // success
  if (st === 'near') return '#F59E0B'; // warning
  return '#DC2626'; // destructive
};

export const ServicesBarChart = ({ data, maxBars = 5, showControls = true }: { data: Datum[]; maxBars?: number; showControls?: boolean }) => {
  const [limit, setLimit] = useState<number | 'all'>(maxBars);
  const effectiveMax = limit === 'all' ? Number.POSITIVE_INFINITY : limit;
  const sliced = useMemo(() => data.slice(0, effectiveMax), [data, effectiveMax]);
  const enriched = useMemo(
    () => sliced.map(d => ({ ...d, fill: colorByStatus(d.pct ?? 0, d.threshold ?? 0) })),
    [sliced]
  );

  // If data empty, render nothing
  if (enriched.length === 0) return null;

  // Use average threshold across shown items for guide line visual continuity
  const avgThreshold = enriched.reduce((s, d) => s + (d.threshold || 0), 0) / enriched.length;

  return (
    <div className="w-full h-80">
      {showControls && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="text-muted-foreground">แสดง:</span>
          {[5, 10, 15].map(n => (
            <button
              key={n}
              className={`px-2 py-0.5 rounded border ${effectiveMax === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border'}`}
              onClick={() => setLimit(n)}
            >
              Top {n}
            </button>
          ))}
          <button
            className={`px-2 py-0.5 rounded border ${limit === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border'}`}
            onClick={() => setLimit('all')}
          >
            ทั้งหมด
          </button>
        </div>
      )}
      <ResponsiveContainer>
        <ComposedChart data={enriched} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} height={60} angle={-20} textAnchor="end" />
          <YAxis tickFormatter={(v) => `${v}%`} width={40} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const v = payload[0].value as number;
            const th = (payload.find(p => p.dataKey === 'threshold')?.value as number) ?? avgThreshold;
            return (
              <div className="rounded border bg-white text-gray-900 p-2 shadow-md">
                <div className="text-xs font-medium mb-1">{label}</div>
                <div className="text-xs">ร้อยละ: <span className="font-semibold">{formatPercentage(v)}</span></div>
                <div className="text-xs">เกณฑ์ผ่าน: <span className="font-semibold">{formatPercentage(th)}</span></div>
              </div>
            );
          }} />
          <Bar dataKey="pct" radius={[6,6,0,0]}>
            {enriched.map((entry, index) => (
              <Cell key={`c-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <Line type="monotone" dataKey={() => avgThreshold} stroke="#64748B" dot={false} strokeDasharray="6 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
