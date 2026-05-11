export function Loader({ label = "Loading lineage data…" }: { label?: string }) {
  return (
    <div className="py-20 text-center text-slate-400">
      <div className="inline-block w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <div className="mt-3 text-sm">{label}</div>
    </div>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="py-10 px-6 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
      Failed to load <span className="codeish">/lineage.json</span>: {msg}.
      Run <span className="codeish">npm run build:data</span> from the <span className="codeish">ui/</span> directory.
    </div>
  );
}
