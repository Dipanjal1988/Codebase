"use client";
import { useState } from "react";
import { useLineageData } from "@/lib/data";
import { Picker } from "../components/Picker";
import { MetadataCard, Tag } from "../components/MetadataCard";
import { LineageGraph } from "../components/LineageGraph";
import { Loader, ErrorBox } from "../components/Loader";

export default function DomainsPage() {
  const { data, error } = useLineageData();
  const [key, setKey] = useState<string | undefined>(undefined);

  const domains = data?.domains ?? [];
  const selected = domains.find((d) => d.domain === key) ?? domains[0];

  if (error) return <ErrorBox msg={error} />;
  if (!data) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Domain Summary</h1>
        <p className="text-sm text-slate-600 mt-1">
          High-level rollup per business domain across {data.generated_from}.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-medium">Domain</th>
              <th className="px-5 py-2 font-medium">Jobs</th>
              <th className="px-5 py-2 font-medium">Tables</th>
              <th className="px-5 py-2 font-medium">Job types</th>
              <th className="px-5 py-2 font-medium">Dialects</th>
              <th className="px-5 py-2 font-medium">Sources / Targets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.map((d) => (
              <tr
                key={d.domain}
                onClick={() => setKey(d.domain)}
                className={`cursor-pointer ${
                  d.domain === selected?.domain ? "bg-brand-50/50" : "hover:bg-slate-50"
                }`}
              >
                <td className="px-5 py-2 font-medium text-slate-900">{d.domain}</td>
                <td className="px-5 py-2 text-slate-700">{d.job_count}</td>
                <td className="px-5 py-2 text-slate-700">{d.table_count}</td>
                <td className="px-5 py-2 text-slate-600">
                  {Object.entries(d.job_types).map(([k, n]) => `${k}(${n})`).join(", ")}
                </td>
                <td className="px-5 py-2 text-slate-600">
                  {Object.entries(d.dialects).map(([k, n]) => `${k}(${n})`).join(", ")}
                </td>
                <td className="px-5 py-2 text-slate-600">
                  {d.source_objects.length} / {d.target_objects.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <Picker
            label="Drill into a domain"
            items={domains}
            itemKey={(d) => d.domain}
            itemLabel={(d) => `${d.domain} (${d.job_count} jobs)`}
            itemSearchText={(d) => d.domain}
            selectedKey={selected?.domain}
            onSelect={(d) => setKey(d.domain)}
          />
        </div>

        <div className="col-span-12 md:col-span-8 space-y-6">
          {selected && (
            <>
              <MetadataCard
                title={`Domain: ${selected.domain}`}
                narrative={selected.narrative}
                fields={[
                  {
                    label: "Tags",
                    value: (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(selected.dialects).map((d) => (
                          <Tag key={d} tone="blue">
                            {d}
                          </Tag>
                        ))}
                        {Object.keys(selected.job_types).map((t) => (
                          <Tag key={t} tone="amber">
                            {t}
                          </Tag>
                        ))}
                      </div>
                    ),
                  },
                  { label: "Jobs", value: selected.job_count },
                  { label: "Distinct tables", value: selected.table_count },
                  { label: "Source objects", value: selected.source_objects.length },
                  { label: "Target objects", value: selected.target_objects.length },
                ]}
              />

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Domain lineage</div>
                <LineageGraph
                  nodes={[
                    ...selected.source_objects.map((s) => ({ id: s, label: s, kind: "source" as const, sub: "source" })),
                    ...selected.target_objects.map((t) => ({ id: t, label: t, kind: "target" as const, sub: "target" })),
                  ]}
                  edges={selected.edges.map((e) => ({
                    source: e.source,
                    target: e.target,
                    label: `${e.job_count} jobs`,
                  }))}
                  height={Math.min(160 + selected.target_objects.length * 70, 720)}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ObjectList title="Source objects" items={selected.source_objects} />
                <ObjectList title="Target objects" items={selected.target_objects} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
        {items.map((i) => (
          <li key={i} className="px-5 py-1.5 font-mono text-[12.5px] text-slate-700">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
