"use client";
import { useMemo, useState } from "react";
import { useLineageData } from "@/lib/data";
import { Picker } from "../components/Picker";
import { MetadataCard, Tag } from "../components/MetadataCard";
import { LineageGraph } from "../components/LineageGraph";
import { Loader, ErrorBox } from "../components/Loader";
import type { ColumnEntry } from "@/lib/types";

export default function ColumnsPage() {
  const { data, error } = useLineageData();
  const [tableKey, setTableKey] = useState<string | undefined>(undefined);
  const [columnKey, setColumnKey] = useState<string | undefined>(undefined);

  const tablesWithCols = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.columns.map((c) => c.target_table))).sort();
  }, [data]);

  const activeTable = tableKey ?? tablesWithCols[0];
  const columnsForTable: ColumnEntry[] = useMemo(() => {
    if (!data) return [];
    return data.columns.filter((c) => c.target_table === activeTable);
  }, [data, activeTable]);

  const selected = columnsForTable.find((c) => c.column === columnKey) ?? columnsForTable[0];

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Column-level Lineage</h1>
        <p className="text-sm text-slate-600 mt-1">
          Trace a target column back to its source columns across every job that produces it.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4 space-y-4">
          <Picker
            label="Target table"
            items={tablesWithCols}
            itemKey={(t) => t}
            itemLabel={(t) => t}
            itemSearchText={(t) => t}
            selectedKey={activeTable}
            onSelect={(t) => {
              setTableKey(t);
              setColumnKey(undefined);
            }}
          />
          <Picker
            label="Column"
            items={columnsForTable}
            itemKey={(c) => c.column}
            itemLabel={(c) => c.column}
            itemSearchText={(c) => c.column}
            selectedKey={selected?.column}
            onSelect={(c) => setColumnKey(c.column)}
          />
        </div>

        <div className="col-span-12 md:col-span-8 space-y-6">
          {selected && (
            <>
              <MetadataCard
                title={`${selected.target_table} · ${selected.column}`}
                narrative={selected.narrative}
                fields={[
                  {
                    label: "Tags",
                    value: (
                      <div className="flex flex-wrap gap-1.5">
                        <Tag tone="emerald">target column</Tag>
                        <Tag tone="slate">{selected.mapping.length} contributing job(s)</Tag>
                      </div>
                    ),
                  },
                  { label: "Distinct source columns", value:
                    Array.from(new Set(selected.mapping.map((m) => m.source_column).filter(Boolean))).join(", ") || "—",
                    mono: true,
                  },
                  { label: "Source objects", value:
                    Array.from(new Set(selected.mapping.map((m) => m.source_object).filter(Boolean))).join(", ") || "—",
                    mono: true,
                  },
                ]}
              />

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Lineage</div>
                <LineageGraph
                  nodes={buildColumnNodes(selected)}
                  edges={buildColumnEdges(selected)}
                  height={Math.min(120 + selected.mapping.length * 40, 600)}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Contributing jobs ({selected.mapping.length})
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-2 font-medium">Job</th>
                        <th className="px-5 py-2 font-medium">Source object</th>
                        <th className="px-5 py-2 font-medium">Source column</th>
                        <th className="px-5 py-2 font-medium">Dialect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.mapping.map((m) => (
                        <tr key={m.job_id} className="hover:bg-slate-50">
                          <td className="px-5 py-1.5 font-mono text-slate-700">#{m.job_id}</td>
                          <td className="px-5 py-1.5 font-mono text-[12.5px] text-slate-700">
                            {m.source_object ?? "—"}
                          </td>
                          <td className="px-5 py-1.5 font-mono text-[12.5px] text-blue-700">
                            {m.source_column ?? "—"}
                          </td>
                          <td className="px-5 py-1.5 text-slate-600">{m.dialect}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildColumnNodes(c: ColumnEntry) {
  const sources = Array.from(
    new Set(
      c.mapping
        .filter((m) => m.source_object && m.source_column)
        .map((m) => `${m.source_object}.${m.source_column}`)
    )
  );
  return [
    ...sources.map((s) => ({ id: s, label: s, kind: "source" as const, sub: "source col" })),
    {
      id: `${c.target_table}.${c.column}`,
      label: `${c.target_table}.${c.column}`,
      kind: "target" as const,
      sub: "target col",
    },
  ];
}

function buildColumnEdges(c: ColumnEntry) {
  const tgtId = `${c.target_table}.${c.column}`;
  const seen = new Map<string, number>();
  c.mapping.forEach((m) => {
    if (!m.source_object || !m.source_column) return;
    const k = `${m.source_object}.${m.source_column}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  });
  return Array.from(seen.entries()).map(([s, n]) => ({
    source: s,
    target: tgtId,
    label: `${n} job${n === 1 ? "" : "s"}`,
  }));
}
