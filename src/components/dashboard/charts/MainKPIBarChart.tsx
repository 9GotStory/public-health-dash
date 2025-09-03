import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, Cell } from 'recharts';
import { formatPercentage } from '@/lib/format';
import { getThresholdStatus } from '@/lib/kpi';

type Item = { name: string; avg: number; threshold: number };

const colorByStatus = (avg: number, th: number) => {
  const st = getThresholdStatus(avg, th);
  if (st === 'passed') return '#16A34A'; // success
  if (st === 'near') return '#F59E0B'; // warning
  return '#DC2626'; // destructive
};

export const MainKPIBarChart = ({ data, maxBars = 5 }: { data: Item[]; maxBars?: number }) => {
  const enriched = useMemo(() => {
    const sorted = [...data].sort((a, b) => (b.avg - a.avg));
    const sliced = sorted.slice(0, maxBars);
    return sliced.map(d => ({ ...d, fill: colorByStatus(d.avg ?? 0, d.threshold ?? 0) }));
  }, [data, maxBars]);

  if (enriched.length === 0) return null;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <ComposedChart data={enriched} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} height={50} />
          <YAxis tickFormatter={(v) => `${v}%`} width={40} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const v = payload.find(p => p.dataKey === 'avg')?.value as number;
            const th = payload.find(p => p.dataKey === 'threshold')?.value as number;
            return (
              <div className="rounded border bg-white text-gray-900 p-2 shadow-md">
                <div className="text-xs font-medium mb-1">{label}</div>
                <div className="text-xs">ร้อยละเฉลี่ย: <span className="font-semibold">{formatPercentage(v)}</span></div>
                {typeof th === 'number' && (
                  <div className="text-xs">เกณฑ์ผ่าน: <span className="font-semibold">{formatPercentage(th)}</span></div>
                )}
              </div>
            );
          }} />
          <Bar dataKey="avg" radius={[6,6,0,0]}>
            {enriched.map((entry, index) => (
              <Cell key={`c-${index}`} fill={entry.fill} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="threshold" stroke="#64748B" dot={{ r: 3 }} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

