import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatPercentage } from '@/lib/format';

type Item = { name: string; avg: number };

const colorByAbsolute = (avg: number) => {
  if (avg >= 80) return '#16A34A'; // success
  if (avg >= 60) return '#F59E0B'; // warning
  return '#DC2626'; // destructive
};

export const GroupOverviewBarChart = ({ data, maxBars = 5 }: { data: Item[]; maxBars?: number }) => {
  const enriched = useMemo(() => {
    const sorted = [...data].sort((a, b) => (b.avg - a.avg));
    const sliced = sorted.slice(0, maxBars);
    return sliced.map(d => ({ ...d, fill: colorByAbsolute(d.avg ?? 0) }));
  }, [data, maxBars]);

  if (enriched.length === 0) return null;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <ComposedChart data={enriched} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={60} angle={-15} textAnchor="end" />
          <YAxis tickFormatter={(v) => `${v}%`} width={40} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const v = payload.find(p => p.dataKey === 'avg')?.value as number;
            return (
              <div className="rounded border bg-white text-gray-900 p-2 shadow-md">
                <div className="text-xs font-medium mb-1">{label}</div>
                <div className="text-xs">ร้อยละเฉลี่ย: <span className="font-semibold">{formatPercentage(v)}</span></div>
              </div>
            );
          }} />
          <Bar dataKey="avg" radius={[6,6,0,0]}>
            {enriched.map((entry, index) => (
              <Cell key={`c-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

