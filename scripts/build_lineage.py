"""Generate ui/public/lineage.json from the parsed job files.

Beyond the raw structured fields, this emits auto-generated narratives for
each job, table, column and domain so the React UI can show plain-English
descriptions without an LLM call.
"""
from __future__ import annotations

import json
import os
import sys
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO)

from app.parser import load_all_jobs, jobs_by_table, domain_summary


DIALECT_LABEL = {
    "oracle_plsql": "Oracle PL/SQL",
    "teradata_bteq": "Teradata BTEQ",
    "pyspark": "PySpark",
    "bigquery_sql": "BigQuery SQL",
    "snowflake_sql": "Snowflake SQL",
    "spark_sql": "Spark SQL",
    "unix_shell": "Unix shell",
}

JOB_TYPE_VERB = {
    "ingestion": "ingests",
    "curation": "curates",
    "aggregation": "aggregates",
    "validation": "validates",
    "scheduling": "orchestrates",
    "standardize": "standardizes",
}


def _label(d: str) -> str:
    return DIALECT_LABEL.get(d, d)


def _verb(t: str) -> str:
    return JOB_TYPE_VERB.get(t, t)


def _classify_table(qualified: str) -> str:
    """Best-effort role classification from the schema prefix."""
    schema = qualified.split(".", 1)[0].lower()
    if schema.startswith("ftr_raw"):
        return "raw landing"
    if schema.startswith("vz_curated"):
        return "curated"
    if schema.startswith("audit_control"):
        return "audit/control"
    if "mart" in schema:
        return "mart"
    return "data"


def job_narrative(rec, by_table) -> str:
    sibling_writers = len(by_table[rec.target_object]["writes"])
    src_role = _classify_table(rec.source_object) if rec.source_object else "external"
    tgt_role = _classify_table(rec.target_object)
    col_count = len(rec.target_columns) if rec.target_columns else 0
    col_phrase = f"{col_count} columns" if col_count else "the full record"
    sibling_phrase = (
        f"It is one of {sibling_writers} jobs that write to this target."
        if sibling_writers > 1 else
        "It is the sole writer of this target."
    )
    return (
        f"{rec.job_type.capitalize()} job #{rec.job_id} {_verb(rec.job_type)} the "
        f"`{rec.domain}.{rec.table}` table by reading from `{rec.source_object}` "
        f"({src_role}) and writing to `{rec.target_object}` ({tgt_role}) using "
        f"{_label(rec.dialect)}. It propagates {col_phrase} and appends "
        f"lineage audit columns (`lineage_load_ts`, `lineage_job_id`). "
        f"{sibling_phrase}"
    )


def table_narrative(table: str, info: dict, all_records) -> str:
    role = _classify_table(table)
    n_writes = len(info["writes"])
    n_reads = len(info["reads"])
    domains = sorted({r.domain for r in info["writes"] + info["reads"]})
    dialects = sorted({_label(r.dialect) for r in info["writes"] + info["reads"]})

    parts = [f"`{table}` is a {role} object in the {', '.join(domains)} domain(s)."]
    if n_writes:
        parts.append(
            f"It is populated by {n_writes} job"
            f"{'s' if n_writes != 1 else ''} "
            f"({', '.join(dialects)})."
        )
    else:
        parts.append("It is a source-of-record (no upstream jobs in this repo).")
    if n_reads:
        parts.append(
            f"It is consumed downstream by {n_reads} job"
            f"{'s' if n_reads != 1 else ''}."
        )
    else:
        parts.append("It is a terminal table (not consumed by any job in this repo).")
    return " ".join(parts)


def column_narrative(target_table: str, column: str, writers) -> str:
    contributors = [w for w in writers if column in w.target_columns]
    if not contributors:
        return f"Column `{column}` is not produced by any tracked job."
    sources = sorted({w.source_object for w in contributors if w.source_object})
    src_cols = []
    for w in contributors:
        idx = w.target_columns.index(column)
        if idx < len(w.column_mapping):
            src_cols.append(w.column_mapping[idx][0])
    src_cols = sorted(set(src_cols))
    src_col_phrase = (
        f"sourced from `{', '.join(src_cols)}`"
        if src_cols and src_cols != ["(literal/derived)"]
        else "derived from a literal or expression"
    )
    return (
        f"Column `{target_table}.{column}` is written by {len(contributors)} job"
        f"{'s' if len(contributors) != 1 else ''}, "
        f"{src_col_phrase} in {', '.join(f'`{s}`' for s in sources) or 'an external source'}."
    )


def domain_narrative(domain: str, v: dict) -> str:
    types = ", ".join(f"{n} {t}" for t, n in v["job_types"].items())
    dialects = ", ".join(_label(d) for d in v["dialects"].keys())
    return (
        f"The `{domain}` domain runs {v['job_count']} jobs across "
        f"{v['table_count']} tables. Workload: {types}. "
        f"Implementation: {dialects}. Reads from "
        f"{len(v['source_objects'])} upstream object(s) and writes to "
        f"{len(v['target_objects'])} target object(s)."
    )


def main() -> None:
    records = load_all_jobs()
    by_table = jobs_by_table(records)
    summary = domain_summary(records)

    # Jobs
    jobs_json = []
    for r in records:
        d = r.to_dict()
        d["narrative"] = job_narrative(r, by_table)
        jobs_json.append(d)

    # Tables (aggregate per qualified table)
    tables_json = []
    for table, info in sorted(by_table.items()):
        tables_json.append({
            "qualified": table,
            "role": _classify_table(table),
            "domains": sorted({r.domain for r in info["writes"] + info["reads"]}),
            "writes": [
                {"job_id": r.job_id, "source": r.source_object, "dialect": r.dialect,
                 "job_type": r.job_type, "file": r.file_name}
                for r in info["writes"]
            ],
            "reads": [
                {"job_id": r.job_id, "target": r.target_object, "dialect": r.dialect,
                 "job_type": r.job_type, "file": r.file_name}
                for r in info["reads"]
            ],
            "narrative": table_narrative(table, info, records),
        })

    # Columns — for each target table that has columns, emit one entry per column.
    columns_json = []
    for table, info in by_table.items():
        writers = [r for r in info["writes"] if r.target_columns]
        if not writers:
            continue
        col_set: list[str] = []
        for w in writers:
            for c in w.target_columns:
                if c not in col_set:
                    col_set.append(c)
        for col in col_set:
            contributors = [w for w in writers if col in w.target_columns]
            mapping = []
            for w in contributors:
                idx = w.target_columns.index(col)
                src_col = w.column_mapping[idx][0] if idx < len(w.column_mapping) else None
                mapping.append({
                    "job_id": w.job_id,
                    "source_object": w.source_object,
                    "source_column": src_col,
                    "dialect": w.dialect,
                    "job_type": w.job_type,
                })
            columns_json.append({
                "target_table": table,
                "column": col,
                "mapping": mapping,
                "narrative": column_narrative(table, col, writers),
            })

    # Domains
    domains_json = []
    for d, v in sorted(summary.items()):
        domains_json.append({
            "domain": d,
            "job_count": v["job_count"],
            "table_count": v["table_count"],
            "job_types": v["job_types"],
            "dialects": v["dialects"],
            "source_objects": v["source_objects"],
            "target_objects": v["target_objects"],
            "edges": _domain_edges(records, d),
            "narrative": domain_narrative(d, v),
        })

    out = {
        "jobs": jobs_json,
        "tables": tables_json,
        "columns": columns_json,
        "domains": domains_json,
        "generated_from": f"{len(records)} job files",
    }

    out_path = os.path.join(REPO, "ui", "public", "lineage.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {out_path}")
    print(f"  jobs={len(jobs_json)} tables={len(tables_json)} "
          f"columns={len(columns_json)} domains={len(domains_json)}")


def _domain_edges(records, domain: str) -> list[dict]:
    counts: dict[tuple[str, str], int] = defaultdict(int)
    for r in records:
        if r.domain != domain or not r.source_object:
            continue
        counts[(r.source_object, r.target_object)] += 1
    return [
        {"source": s, "target": t, "job_count": n}
        for (s, t), n in counts.items()
    ]


if __name__ == "__main__":
    main()
