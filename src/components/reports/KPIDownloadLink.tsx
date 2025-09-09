import React from 'react';

type Props = {
  id: string;
  path: string;
  label?: React.ReactNode;
  className?: string;
  // Optional custom filename (without extension). If omitted, defaults to kpi_<id>_<YYYY-MM-DD>
  filenameBase?: string;
};

function isoDate(date = new Date()) {
  // YYYY-MM-DD
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export const KPIDownloadLink: React.FC<Props> = ({ id, path, label, className, filenameBase }) => {
  const base = filenameBase || `kpi_${id}_${isoDate()}`;
  const filename = `${base}.pdf`;
  return (
    <a href={path} download={filename} className={className}>
      {label ?? 'ดาวน์โหลด PDF'}
    </a>
  );
};

export default KPIDownloadLink;

