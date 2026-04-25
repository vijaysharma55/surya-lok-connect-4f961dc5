import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export type SearchableOption = { value: string; label: string };

type Props = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** When true, show a Drawer on mobile for a fuller typeahead UX. Default true. */
  mobileDrawer?: boolean;
};

/**
 * Mobile-friendly searchable select with typeahead.
 * - Desktop: popover with filterable list
 * - Mobile: bottom drawer with a sticky search input
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled,
  ariaLabel,
  mobileDrawer = true,
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (open) {
      // Defer focus until popover/drawer mounts
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const handlePick = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const Trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-label={ariaLabel}
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "w-full justify-between font-normal",
        !selected && "text-muted-foreground",
      )}
      onClick={() => setOpen(true)}
    >
      <span className="truncate">{selected?.label ?? placeholder}</span>
      <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
    </Button>
  );

  const List = (
    <div role="listbox" aria-label={ariaLabel} className="max-h-72 overflow-y-auto py-1">
      {filtered.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        filtered.map((o) => {
          const isSelected = o.value === value;
          return (
            <button
              type="button"
              key={o.value}
              role="option"
              aria-selected={isSelected}
              onClick={() => handlePick(o.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                isSelected && "bg-accent/60 font-medium",
              )}
            >
              <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
              <span className="truncate">{o.label}</span>
            </button>
          );
        })
      )}
    </div>
  );

  const SearchBox = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="pl-9 pr-9"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  // Mobile: bottom drawer with sticky search
  if (isMobile && mobileDrawer) {
    return (
      <>
        {Trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-base">{ariaLabel ?? placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2">{SearchBox}</div>
            <div className="px-2 pb-6">{List}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[260px]" align="start">
        <div className="p-2 border-b">{SearchBox}</div>
        {List}
      </PopoverContent>
    </Popover>
  );
}
