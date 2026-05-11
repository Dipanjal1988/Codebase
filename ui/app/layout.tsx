import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lineage Agent",
  description: "Job, table, column lineage and domain summary for the Verizon data-pipeline repo.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Job Lineage" },
  { href: "/tables", label: "Table Lineage" },
  { href: "/columns", label: "Column Lineage" },
  { href: "/domains", label: "Domain Summary" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
            <Link href="/" className="font-semibold text-brand-700">
              Lineage<span className="text-slate-400 font-normal">·</span>Agent
            </Link>
            <nav className="flex gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
