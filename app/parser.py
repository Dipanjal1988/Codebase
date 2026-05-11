"""Parse Verizon data-pipeline job files into structured lineage records.

Every file in the repo carries a uniform header block listing JOB_ID, JOB_TYPE,
DIALECT, SOURCE_OBJECT and TARGET_OBJECT regardless of file extension. We rely
on that header for the authoritative metadata and use dialect-specific regex
heuristics to recover column lists for column-level lineage.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field, asdict
from functools import lru_cache
from glob import glob
from typing import Optional

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JOB_FILE_GLOBS = ("*.sql", "*.bteq", "*.py", "*.sh")

HEADER_KEYS = (
    "FILE_NAME_CONTEXT",
    "JOB_ID",
    "JOB_TYPE",
    "DIALECT",
    "SOURCE_OBJECT",
    "TARGET_OBJECT",
)


@dataclass
class JobRecord:
    file_name: str
    file_path: str
    job_id: int
    job_type: str
    dialect: str
    domain: str
    table: str
    source_object: str
    target_object: str
    description: str
    source_columns: list[str] = field(default_factory=list)
    target_columns: list[str] = field(default_factory=list)
    column_mapping: list[tuple[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["column_mapping"] = [list(m) for m in self.column_mapping]
        return d


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _parse_header(text: str) -> dict[str, str]:
    """Pull the FILE_NAME_CONTEXT / JOB_ID / ... block out of a file."""
    out: dict[str, str] = {}
    for key in HEADER_KEYS:
        m = re.search(rf"{key}\s*:\s*(.+)", text)
        if m:
            out[key] = m.group(1).strip()
    return out


def _split_columns(col_list: str) -> list[str]:
    """Split a parenthesized column list, respecting nested parens."""
    cols, buf, depth = [], [], 0
    for ch in col_list:
        if ch == "(":
            depth += 1
            buf.append(ch)
        elif ch == ")":
            depth -= 1
            buf.append(ch)
        elif ch == "," and depth == 0:
            cols.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    if buf:
        cols.append("".join(buf).strip())
    return [c for c in cols if c]


def _extract_sql_target_columns(text: str, target: str) -> list[str]:
    """INSERT INTO target (col, col, ...) — return the column list."""
    pattern = re.compile(
        rf"INSERT\s+INTO\s+{re.escape(target)}\s*\(([^)]+)\)",
        re.IGNORECASE | re.DOTALL,
    )
    m = pattern.search(text)
    if not m:
        return []
    return _split_columns(m.group(1))


def _extract_sql_source_columns(text: str) -> list[str]:
    """Pull `s.<col>` references from SELECT clauses (jobs alias source as s)."""
    refs = re.findall(r"\bs\.([a-zA-Z_][a-zA-Z0-9_]*)", text)
    seen, out = set(), []
    for r in refs:
        if r.lower() not in seen:
            out.append(r)
            seen.add(r.lower())
    return out


def _extract_pyspark_columns(text: str) -> tuple[list[str], list[str]]:
    """PySpark uses .select(col("a"), col("b"), ...) — both source and target."""
    select_block = re.search(
        r"\.select\(\s*(.*?)\s*\)\s*\n", text, re.DOTALL
    )
    src_cols: list[str] = []
    if select_block:
        src_cols = re.findall(r'col\(\s*"([^"]+)"', select_block.group(1))
    # Ingestion jobs append lineage columns via .withColumn(...)
    extra = re.findall(r'\.withColumn\(\s*"([^"]+)"', text)
    tgt_cols = src_cols + [c for c in extra if c not in src_cols]
    return src_cols, tgt_cols


def _domain_and_table(filename: str, source_object: str) -> tuple[str, str]:
    """Derive (domain, table) from filename and source object."""
    # filename: vz_<domain>_<table_parts>_<action>_<stage>_<engine>_job_<NNN>.<ext>
    base = filename.rsplit(".", 1)[0]
    parts = base.split("_")
    domain = parts[1] if len(parts) > 1 else "unknown"
    # source_object is `<schema>.<domain>_<table>` — strip schema and domain prefix
    table = source_object.split(".")[-1]
    if table.startswith(domain + "_"):
        table = table[len(domain) + 1 :]
    return domain, table


def parse_file(path: str) -> Optional[JobRecord]:
    text = _read(path)
    header = _parse_header(text)
    if "JOB_ID" not in header or "TARGET_OBJECT" not in header:
        return None

    file_name = os.path.basename(path)
    dialect = header.get("DIALECT", "")
    target = header["TARGET_OBJECT"]
    source = header.get("SOURCE_OBJECT", "")

    if dialect == "pyspark":
        src_cols, tgt_cols = _extract_pyspark_columns(text)
    else:
        tgt_cols = _extract_sql_target_columns(text, target)
        src_cols = _extract_sql_source_columns(text)
        # Some shell jobs use SELECT * — fall back to "(all columns)"
        if not tgt_cols and re.search(r"SELECT\s+\*", text, re.IGNORECASE):
            tgt_cols = ["(all columns from source)"]
            src_cols = src_cols or ["(all columns)"]

    # Position-aligned column mapping (skip target cols populated by literals)
    mapping: list[tuple[str, str]] = []
    for i, tgt in enumerate(tgt_cols):
        if i < len(src_cols):
            mapping.append((src_cols[i], tgt))
        else:
            mapping.append(("(literal/derived)", tgt))

    domain, table = _domain_and_table(file_name, source or target)

    return JobRecord(
        file_name=file_name,
        file_path=path,
        job_id=int(header["JOB_ID"]),
        job_type=header.get("JOB_TYPE", ""),
        dialect=dialect,
        domain=domain,
        table=table,
        source_object=source,
        target_object=target,
        description=header.get("FILE_NAME_CONTEXT", ""),
        source_columns=src_cols,
        target_columns=tgt_cols,
        column_mapping=mapping,
    )


@lru_cache(maxsize=1)
def load_all_jobs() -> list[JobRecord]:
    """Parse every job file in the repo root. Cached for the process lifetime."""
    paths: list[str] = []
    for pattern in JOB_FILE_GLOBS:
        paths.extend(glob(os.path.join(REPO_ROOT, pattern)))
    records = []
    for p in sorted(paths):
        try:
            rec = parse_file(p)
            if rec:
                records.append(rec)
        except Exception as e:  # surface but don't kill the load
            print(f"[parser] failed on {p}: {e}")
    return records


# ---- Helpers used by the UI ----

def jobs_by_table(records: list[JobRecord]) -> dict[str, dict[str, list[JobRecord]]]:
    """Map qualified table name -> {"writes": [jobs that target it],
                                    "reads":  [jobs that source from it]}."""
    out: dict[str, dict[str, list[JobRecord]]] = {}
    for r in records:
        out.setdefault(r.target_object, {"writes": [], "reads": []})["writes"].append(r)
        if r.source_object:
            out.setdefault(r.source_object, {"writes": [], "reads": []})["reads"].append(r)
    return out


def domain_summary(records: list[JobRecord]) -> dict[str, dict]:
    """Per-domain rollup: counts by job_type, dialect, table, plus job/table totals."""
    summary: dict[str, dict] = {}
    for r in records:
        d = summary.setdefault(
            r.domain,
            {
                "job_count": 0,
                "table_count": set(),
                "source_objects": set(),
                "target_objects": set(),
                "job_types": {},
                "dialects": {},
            },
        )
        d["job_count"] += 1
        d["table_count"].add(r.table)
        if r.source_object:
            d["source_objects"].add(r.source_object)
        d["target_objects"].add(r.target_object)
        d["job_types"][r.job_type] = d["job_types"].get(r.job_type, 0) + 1
        d["dialects"][r.dialect] = d["dialects"].get(r.dialect, 0) + 1
    # finalize sets to sorted lists / counts
    for d in summary.values():
        d["table_count"] = len(d["table_count"])
        d["source_objects"] = sorted(d["source_objects"])
        d["target_objects"] = sorted(d["target_objects"])
    return summary
