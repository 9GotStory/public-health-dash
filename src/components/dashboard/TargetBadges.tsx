import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TargetBadgesProps {
  items: string[];
  active?: string;
  maxShown?: number;
  className?: string;
  withTooltip?: boolean;
}

export const TargetBadges = ({ items, active, maxShown = 5, className, withTooltip = true }: TargetBadgesProps) => {
  const [showAll, setShowAll] = useState(false);
  const uniqueItems = useMemo(() => Array.from(new Set(items.map(i => (i ?? '').toString().trim()).filter(Boolean))), [items]);
  if (uniqueItems.length === 0) return <span className="text-muted-foreground">-</span>;

  const shown = showAll ? uniqueItems : uniqueItems.slice(0, maxShown);
  const remaining = Math.max(0, uniqueItems.length - maxShown);

  return (
    <div className={cn("flex flex-wrap items-center gap-1 sm:gap-2 min-w-0 target-badges-wrapper", className)} data-role="target-badges">
      {shown.map((t) => {
        const isActive = active && t === active;
        const badgeEl = (
          <Badge
            key={t}
            variant="outline"
            className={cn(
              "text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 break-words max-w-full max-[360px]:truncate max-[360px]:max-w-[45vw]",
              isActive ? "text-primary border-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground"
            )}
            title={t}
          >
            {t}
          </Badge>
        );
        return withTooltip ? (
          <Tooltip key={t}>
            <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">{t}</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          badgeEl
        );
      })}
      {!showAll && remaining > 0 && (
        <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 text-muted-foreground">+{remaining} เพิ่มเติม</Badge>
      )}
      {uniqueItems.length > maxShown && (
        <button
          type="button"
          className="text-xs sm:text-sm text-primary hover:underline"
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? 'ย่อ' : 'แสดงทั้งหมด'}
        </button>
      )}
    </div>
  );
};
