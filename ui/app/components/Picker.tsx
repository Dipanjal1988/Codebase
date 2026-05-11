"use client";
import { useMemo, useState } from "react";

interface Props<T> {
  label: string;
  items: T[];
  itemKey: (i: T) => string;
  itemLabel: (i: T) => string;
  itemSearchText?: (i: T) => string;
  selectedKey?: string;
  onSelect: (i: T) => void;
  placeholder?: string;
}

export function Picker<T>({
  label,
  items,
  itemKey,
  itemLabel,
  itemSearchText,
  selectedKey,
  onSelect,
  placeholder = "Search…",
}: Props<T>) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items.slice(0, 200);
    return items.filter((i) =>
      (itemSearchText ? itemSearchText(i) : itemLabel(i)).toLowerCase().includes(ql)
    ).slice(0, 200);
  }, [items, q, itemLabel, itemSearchText]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </label>
        <span className="text-[11px] text-slate-400">
          {filtered.length} of {items.length}
        </span>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
      />
      <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded">
        {filtered.map((i) => {
          const key = itemKey(i);
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              onClick={() => onSelect(i)}
              className={`w-full text-left px-3 py-2 text-sm font-mono ${
                isSelected
                  ? "bg-brand-50 text-brand-700"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {itemLabel(i)}
            </button>
          );
        })}
        {!filtered.length && (
          <div className="px-3 py-6 text-center text-sm text-slate-400">No matches</div>
        )}
      </div>
    </div>
  );
}
