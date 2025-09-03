import { Badge } from "@/components/ui/badge";
import { getThresholdStatus } from "@/lib/kpi";

interface StatusBadgeProps {
  percentage: number;
  threshold: number;
}

export const StatusBadge = ({ percentage, threshold }: StatusBadgeProps) => {
  const status = getThresholdStatus(percentage, threshold);
  if (status === 'passed') {
    return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
  }
  if (status === 'near') {
    return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
  }
  return <Badge variant="destructive">ไม่ผ่าน</Badge>;
};
