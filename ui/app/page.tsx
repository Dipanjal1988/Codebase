import Link from "next/link";

const CARDS = [
  {
    href: "/jobs",
    title: "Job-level Lineage",
    blurb:
      "Pick a single job and see its source → target flow, the columns it propagates, and a generated narrative describing what it does.",
    accent: "from-blue-50 to-blue-100",
  },
  {
    href: "/tables",
    title: "Table-level Lineage",
    blurb:
      "Pick any qualified table to see every job that writes to or reads from it, with upstream and downstream connections.",
    accent: "from-amber-50 to-amber-100",
  },
  {
    href: "/columns",
    title: "Column-level Lineage",
    blurb:
      "Trace a single target column back to its source columns across all jobs that produce it. Useful for impact analysis.",
    accent: "from-emerald-50 to-emerald-100",
  },
  {
    href: "/domains",
    title: "Domain Summary",
    blurb:
      "High-level rollup per business domain: job counts, dialects, tables, source/target inventory, and a domain-wide lineage graph.",
    accent: "from-violet-50 to-violet-100",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold text-slate-900">Lineage Agent</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Interactive lineage and metadata explorer for the data-pipeline jobs
          in this repo. Every job file (SQL, BTEQ, PySpark, shell) is parsed
          into structured lineage and enriched with auto-generated narratives.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group rounded-xl border border-slate-200 bg-gradient-to-br ${c.accent} p-6 hover:shadow-md transition-shadow`}
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
              {c.title} →
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{c.blurb}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
