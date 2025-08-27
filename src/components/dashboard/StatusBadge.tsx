import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  percentage: number;
  threshold: number;
}

export const StatusBadge = ({ percentage, threshold }: StatusBadgeProps) => {
  if (percentage >= threshold) {
    return <Badge variant="default" className="bg-success text-success-foreground">ผ่าน</Badge>;
  }
  if (percentage >= threshold * 0.8) {
    return <Badge variant="default" className="bg-warning text-warning-foreground">ใกล้เป้า</Badge>;
  }
  return <Badge variant="destructive">ไม่ผ่าน</Badge>;
};
