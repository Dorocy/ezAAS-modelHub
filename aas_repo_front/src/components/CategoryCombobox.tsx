"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCodeList } from "@/api";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeItem {
  c_id?: string;
  value?: string;
  title: string;
  p_id?: string;
}

function CategoryCombobox({
  className = "",
  disabled = false,
  code = "category2",
  value,
  setValue,
}: {
  className?: string;
  disabled?: boolean;
  selectLeafOnly?: boolean;
  code?: "category2" | "aas_category" | "sm_category";
  value: any;
  setValue: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: categorys } = useQuery({
    queryKey: ["common/code", code],
    queryFn: () => getCodeList(code),
  });

  const items: CodeItem[] = useMemo(() => {
    const raw = Array.isArray(categorys?.data) ? categorys.data : Array.isArray(categorys) ? categorys : [];
    if (!search) return raw;
    return raw.filter((item: CodeItem) => item.title?.toLowerCase().includes(search.toLowerCase()));
  }, [categorys, search]);

  const selectedLabel = useMemo(() => {
    const raw = Array.isArray(categorys?.data) ? categorys.data : Array.isArray(categorys) ? categorys : [];
    return raw.find((item: CodeItem) => (item.c_id ?? item.value) === value)?.title ?? "";
  }, [categorys, value]);

  const handleSelect = (item: CodeItem) => {
    setValue(item.c_id ?? item.value);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "flex items-center border rounded-md bg-background px-2 h-9 text-sm gap-1",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          placeholder="Category All"
          disabled={disabled}
          value={open ? search : (selectedLabel || search)}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { setTimeout(() => setOpen(false), 150); }}
        />
        {!disabled && value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setValue(undefined); setSearch(""); }}
            className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {/* All option */}
          <button
            type="button"
            className={cn("w-full px-3 py-1.5 text-left text-sm hover:bg-accent", !value && "font-medium text-primary")}
            onMouseDown={(e) => { e.preventDefault(); setValue(undefined); setOpen(false); }}
          >
            All
          </button>
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No results.</div>
          ) : (
            items.map((item) => {
              const id = item.c_id ?? item.value ?? item.title;
              const isSelected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn("w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2", isSelected && "font-medium text-primary")}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                >
                  <span className="size-1.5 rounded-full bg-primary/60 shrink-0" />
                  {item.title}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryCombobox;
