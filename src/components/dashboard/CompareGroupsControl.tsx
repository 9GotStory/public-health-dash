import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CompareGroupsControlProps {
  allGroups: string[];
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  onClear: () => void;
  onSelectAll: () => void;
  onReplace?: (names: string[]) => void;
}

export const CompareGroupsControl: React.FC<CompareGroupsControlProps> = ({
  allGroups,
  selected,
  onToggle,
  onClear,
  onSelectAll,
  onReplace,
}) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups.filter((g) => g.toLowerCase().includes(q));
  }, [allGroups, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((g) => selected.includes(g));
  const noneSelected = selected.length === 0;

  const handleSelectAllVisible = () => {
    if (onReplace) {
      const merged = Array.from(new Set([...selected, ...filtered]));
      onReplace(merged);
    } else {
      // Fallback: toggle each visible item on
      filtered.forEach((g) => {
        if (!selected.includes(g)) onToggle(g, true);
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                aria-label="เลือกประเด็นเปรียบเทียบ"
                title="เลือกประเด็นเปรียบเทียบ"
              >
                เลือกประเด็นเปรียบเทียบ{selected.length > 0 ? ` (${selected.length})` : ''}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-white text-foreground">
              <DropdownMenuLabel>ประเด็นขับเคลื่อน</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาประเด็น..."
                  className="h-8 text-sm"
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="text-xs text-muted-foreground">
                    เลือกแล้ว {selected.length}/{allGroups.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="xs" onClick={handleSelectAllVisible} disabled={filtered.length === 0 || allVisibleSelected}>
                      เลือกทั้งหมด
                    </Button>
                    <Button variant="ghost" size="xs" onClick={onClear} disabled={noneSelected}>
                      ล้างเลือก
                    </Button>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-64">
                <div className="p-1">
                  {filtered.map((name) => (
                    <DropdownMenuCheckboxItem
                      key={name}
                      checked={selected.includes(name)}
                      onCheckedChange={(checked) => onToggle(name, checked === true)}
                      className="whitespace-normal break-words"
                      title={name}
                    >
                      {name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-2 py-6 text-sm text-muted-foreground">ไม่พบผลลัพธ์</div>
                  )}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              ล้างเลือก
            </Button>
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((g) => (
            <Badge
              key={g}
              variant="secondary"
              className="max-w-[16rem] cursor-default select-none inline-flex items-center gap-1 pr-1"
              title={g}
            >
              <span className="truncate">{g}</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(g, false);
                      }}
                      aria-label={`ลบ ${g}`}
                      className="inline-flex items-center justify-center rounded hover:bg-secondary-foreground/10 text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">ลบออก</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
