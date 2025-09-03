import { TargetBadges } from "./TargetBadges";

interface ContextPathProps {
  groupName?: string;
  mainKPIName?: string;
  subKPIName?: string;
  targetName?: string;
  targets?: string[];
  showBadges?: boolean;
  mainLabelOnly?: boolean;
  subLabelOnly?: boolean;
}

export const ContextPath = ({ groupName, mainKPIName, subKPIName, targetName, targets = [], showBadges = false, mainLabelOnly = false, subLabelOnly = false }: ContextPathProps) => {
  return (
    <div className="text-sm text-muted-foreground break-words">
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {groupName && <span className="break-words">{groupName}</span>}
        {(mainKPIName || mainLabelOnly) && <span className="mx-1">/</span>}
        {mainKPIName ? (
          <span className="text-foreground break-words">ตัวชี้วัดหลัก: {mainKPIName}</span>
        ) : (mainLabelOnly ? (
          <span className="text-foreground break-words">ตัวชี้วัดหลัก</span>
        ) : null)}
        {(subKPIName || subLabelOnly) && <span className="mx-1">/</span>}
        {subKPIName ? (
          <span className="text-foreground break-words">ตัวชี้วัดย่อย: {subKPIName}</span>
        ) : (subLabelOnly ? (
          <span className="text-foreground break-words">ตัวชี้วัดย่อย</span>
        ) : null)}
        {(targetName || showBadges) && <span className="mx-1">/</span>}
        {(targetName || showBadges) && <span className="break-words">กลุ่มเป้าหมาย:</span>}
        {targetName && <TargetBadges items={[targetName]} active={targetName} />}
        {!targetName && showBadges && <TargetBadges items={targets} />}
      </div>
    </div>
  );
};
