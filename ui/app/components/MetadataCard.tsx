interface Field {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

export function MetadataCard({
  title,
  narrative,
  fields,
}: {
  title: string;
  narrative?: string;
  fields: Field[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {narrative && (
        <div className="px-5 py-4 bg-gradient-to-r from-brand-50/80 to-transparent border-b border-slate-100">
          <div className="text-[11px] font-medium uppercase tracking-wide text-brand-600 mb-1">
            Description
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{narrative}</p>
        </div>
      )}
      <dl className="divide-y divide-slate-100">
        {fields.map((f, i) => (
          <div key={i} className="px-5 py-2.5 grid grid-cols-3 gap-4 text-sm">
            <dt className="text-slate-500 font-medium">{f.label}</dt>
            <dd className={`col-span-2 ${f.mono ? "font-mono text-[12.5px] text-slate-700" : "text-slate-800"}`}>
              {f.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Tag({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}
