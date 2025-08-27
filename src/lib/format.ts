export const formatNumber = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? value : num.toLocaleString();
};

export const formatPercentage = (
  value: string | number | null | undefined,
  digits = 2
) => {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '' : `${num.toFixed(digits)}%`;
};
