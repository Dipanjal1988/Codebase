"use client";
import { useMemo, useState } from "react";
import { useLineageData } from "@/lib/data";
import { Picker } from "../components/Picker";
import { MetadataCard, Tag } from "../components/MetadataCard";
import { LineageGraph } from "../components/LineageGraph";
import { Loader, ErrorBox } from "../components/Loader";
import type { JobRecord } from "@/lib/types";

export default function JobsPage() {
  const { data, error } = useLineageData();
  const [domain, setDomain] = useState<string>("(all)");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const filtered = useMemo<JobRecord[]>(() => {
    if (!data) return [];
    return data.jobs.filter((j) => domain === "(all)" || j.domain === domain);
  }, [data, domain]);

  const selected = filtered.find((j) => j.file_name === selectedKey) ?? filtered[0];
  const domains = data ? ["(all)", ...Array.from(new Set(data.jobs.map((j) => j.domain))).sort()] : [];

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Job-level Lineage</h1>
        <p className="text-sm text-slate-600 mt-1">
          Pick a job to see its source-to-target flow, columns it propagates, and a generated narrative.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500 mr-1">Domain:</span>
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              domain === d
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Picker
            label="Jobs"
            items={filtered}
            itemKey={(j) => j.file_name}
            itemLabel={(j) => `#${j.job_id} · ${j.domain}/${j.table}`}
            itemSearchText={(j) => `${j.job_id} ${j.domain} ${j.table} ${j.dialect} ${j.file_name}`}
            selectedKey={selected?.file_name}
            onSelect={(j) => setSelectedKey(j.file_name)}
          />
        </div>

        <div className="col-span-12 md:col-span-8 space-y-6">
          {selected && (
            <>
              <MetadataCard
                title={`Job #${selected.job_id} — ${selected.domain}.${selected.table}`}
                narrative={selected.narrative}
                fields={[
                  {
                    label: "Tags",
                    value: (
                      <div className="flex flex-wrap gap-1.5">
                        <Tag tone="violet">{selected.domain}</Tag>
                        <Tag tone="amber">{selected.job_type}</Tag>
                        <Tag tone="blue">{selected.dialect}</Tag>
                      </div>
                    ),
                  },
                  { label: "Source", value: selected.source_object || "—", mono: true },
                  { label: "Target", value: selected.target_object, mono: true },
                  { label: "File", value: selected.file_name, mono: true },
                  {
                    label: "Columns",
                    value: `${selected.target_columns.length} produced · ${selected.source_columns.length} sourced`,
                  },
                ]}
              />

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Lineage</div>
                <LineageGraph
                  nodes={[
                    ...(selected.source_object
                      ? [
                          {
                            id: selected.source_object,
                            label: selected.source_object,
                            kind: "source" as const,
                            sub: "source",
                          },
                        ]
                      : []),
                    {
                      id: `job-${selected.job_id}`,
                      label: `job #${selected.job_id}`,
                      kind: "job",
                      sub: `${selected.job_type} · ${selected.dialect}`,
                    },
                    {
                      id: selected.target_object,
                      label: selected.target_object,
                      kind: "target",
                      sub: "target",
                    },
                  ]}
                  edges={[
                    ...(selected.source_object
                      ? [{ source: selected.source_object, target: `job-${selected.job_id}` }]
                      : []),
                    { source: `job-${selected.job_id}`, target: selected.target_object },
                  ]}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Column propagation ({selected.column_mapping.length})
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-2 font-medium">#</th>
                        <th className="px-5 py-2 font-medium">Source column</th>
                        <th className="px-5 py-2 font-medium">Target column</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.column_mapping.map(([s, t], i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-5 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-5 py-1.5 font-mono text-[12.5px] text-slate-700">{s}</td>
                          <td className="px-5 py-1.5 font-mono text-[12.5px] text-emerald-700">{t}</td>
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
