"use client";
import { useMemo, useState } from "react";
import { useLineageData } from "@/lib/data";
import { Picker } from "../components/Picker";
import { MetadataCard, Tag } from "../components/MetadataCard";
import { LineageGraph } from "../components/LineageGraph";
import { Loader, ErrorBox } from "../components/Loader";
import type { TableEntry } from "@/lib/types";

export default function TablesPage() {
  const { data, error } = useLineageData();
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const tables = data?.tables ?? [];
  const selected: TableEntry | undefined =
    tables.find((t) => t.qualified === selectedKey) ?? tables[0];

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loader />;

  const upstream = selected ? Array.from(new Set(selected.writes.map((w) => w.source).filter(Boolean))) : [];
  const downstream = selected ? Array.from(new Set(selected.reads.map((r) => r.target))) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Table-level Lineage</h1>
        <p className="text-sm text-slate-600 mt-1">
          Pick a qualified table to see every job that writes to or reads from it.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Picker
            label="Tables"
            items={tables}
            itemKey={(t) => t.qualified}
            itemLabel={(t) => t.qualified}
            itemSearchText={(t) => `${t.qualified} ${t.role} ${t.domains.join(" ")}`}
            selectedKey={selected?.qualified}
            onSelect={(t) => setSelectedKey(t.qualified)}
          />
        </div>

        <div className="col-span-12 md:col-span-8 space-y-6">
          {selected && (
            <>
              <MetadataCard
                title={selected.qualified}
                narrative={selected.narrative}
                fields={[
                  {
                    label: "Tags",
                    value: (
                      <div className="flex flex-wrap gap-1.5">
                        <Tag tone="amber">{selected.role}</Tag>
                        {selected.domains.map((d) => (
                          <Tag key={d} tone="violet">
                            {d}
                          </Tag>
                        ))}
                      </div>
                    ),
                  },
                  { label: "Written by", value: `${selected.writes.length} job(s)` },
                  { label: "Read by", value: `${selected.reads.length} job(s)` },
                  { label: "Upstream tables", value: upstream.length || "—" },
                  { label: "Downstream tables", value: downstream.length || "—" },
                ]}
              />

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Lineage</div>
                <LineageGraph
                  nodes={[
                    ...upstream.map((u) => ({ id: u, label: u, kind: "source" as const, sub: "upstream" })),
                    { id: selected.qualified, label: selected.qualified, kind: "neutral", sub: selected.role },
                    ...downstream.map((d) => ({ id: d, label: d, kind: "target" as const, sub: "downstream" })),
                  ]}
                  edges={[
                    ...upstream.map((u) => ({
                      source: u,
                      target: selected.qualified,
                      label: `${selected.writes.filter((w) => w.source === u).length} jobs`,
                    })),
                    ...downstream.map((d) => ({
                      source: selected.qualified,
                      target: d,
                      label: `${selected.reads.filter((r) => r.target === d).length} jobs`,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JobList title={`Writers (${selected.writes.length})`} rows={selected.writes.map((w) => ({
                  job_id: w.job_id, peer: w.source, dialect: w.dialect, job_type: w.job_type, file: w.file,
                }))} peerLabel="Source" emptyText="No upstream writers — this is a source-of-record." />
                <JobList title={`Readers (${selected.reads.length})`} rows={selected.reads.map((r) => ({
                  job_id: r.job_id, peer: r.target, dialect: r.dialect, job_type: r.job_type, file: r.file,
                }))} peerLabel="Target" emptyText="No downstream readers — terminal table." />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Row {
  job_id: number;
  peer: string;
  dialect: string;
  job_type: string;
  file: string;
}

function JobList({ title, rows, peerLabel, emptyText }: { title: string; rows: Row[]; peerLabel: string; emptyText: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {!rows.length ? (
        <div className="px-5 py-6 text-sm text-slate-400">{emptyText}</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2 font-medium">Job</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Dialect</th>
                <th className="px-5 py-2 font-medium">{peerLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.job_id} className="hover:bg-slate-50">
                  <td className="px-5 py-1.5 font-mono text-slate-700">#{r.job_id}</td>
                  <td className="px-5 py-1.5 text-slate-700">{r.job_type}</td>
                  <td className="px-5 py-1.5 text-slate-600">{r.dialect}</td>
                  <td className="px-5 py-1.5 font-mono text-[12.5px] text-slate-700">{r.peer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
