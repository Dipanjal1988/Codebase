"""Lineage Agent UI for the Verizon data-pipeline repo.

Sidebar offers four modes:
  1. Job-level Lineage with Metadata
  2. Table-level Lineage with Metadata
  3. Column-level Lineage with Metadata
  4. Domain Summary

Each mode renders both a graphviz lineage graph and a structured metadata table.
"""
from __future__ import annotations

import sys
import os

# Allow `streamlit run app/streamlit_app.py` from the repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import streamlit as st
import graphviz

from app.parser import load_all_jobs, jobs_by_table, domain_summary, JobRecord


st.set_page_config(page_title="Lineage Agent", layout="wide")


@st.cache_data(show_spinner="Parsing job files...")
def _load() -> list[JobRecord]:
    return load_all_jobs()


RECORDS = _load()
BY_TABLE = jobs_by_table(RECORDS)
DOMAINS = sorted({r.domain for r in RECORDS})


# ---------- Shared rendering helpers ----------

def metadata_table(rows: list[dict]) -> None:
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)


def job_metadata_dict(r: JobRecord) -> dict:
    return {
        "Job ID": r.job_id,
        "Domain": r.domain,
        "Table": r.table,
        "Job Type": r.job_type,
        "Dialect": r.dialect,
        "Source Object": r.source_object or "—",
        "Target Object": r.target_object,
        "File": r.file_name,
        "Description": r.description,
    }


def job_lineage_graph(r: JobRecord) -> graphviz.Digraph:
    g = graphviz.Digraph()
    g.attr(rankdir="LR", fontname="Helvetica")
    g.attr("node", shape="box", style="rounded,filled", fontname="Helvetica")
    if r.source_object:
        g.node(r.source_object, r.source_object, fillcolor="#E3F2FD")
    g.node(r.target_object, r.target_object, fillcolor="#E8F5E9")
    g.node(
        f"job_{r.job_id}",
        f"job {r.job_id}\n{r.job_type} / {r.dialect}",
        shape="ellipse",
        fillcolor="#FFF3E0",
    )
    if r.source_object:
        g.edge(r.source_object, f"job_{r.job_id}")
    g.edge(f"job_{r.job_id}", r.target_object)
    return g


# ---------- Mode 1: Job-level lineage ----------

def render_job_lineage() -> None:
    st.header("Job-level Lineage with Metadata")
    domain = st.selectbox("Filter by domain", ["(all)"] + DOMAINS)
    pool = [r for r in RECORDS if domain == "(all)" or r.domain == domain]
    labels = [f"{r.job_id:>4} | {r.domain}/{r.table} | {r.dialect}" for r in pool]
    if not pool:
        st.info("No jobs match this filter.")
        return
    choice = st.selectbox("Select a job", range(len(pool)), format_func=lambda i: labels[i])
    r = pool[choice]

    col_meta, col_graph = st.columns([1, 1])
    with col_meta:
        st.subheader("Metadata")
        meta = job_metadata_dict(r)
        metadata_table([{"Field": k, "Value": str(v)} for k, v in meta.items()])
    with col_graph:
        st.subheader("Lineage")
        st.graphviz_chart(job_lineage_graph(r))

    st.subheader("Columns produced by this job")
    if r.target_columns:
        st.dataframe(
            pd.DataFrame({"#": range(1, len(r.target_columns) + 1), "Target Column": r.target_columns}),
            use_container_width=True,
            hide_index=True,
        )
    else:
        st.caption("No explicit column list detected (likely SELECT * or shell wrapper).")


# ---------- Mode 2: Table-level lineage ----------

def render_table_lineage() -> None:
    st.header("Table-level Lineage with Metadata")
    tables = sorted(BY_TABLE.keys())
    domain = st.selectbox("Filter by domain", ["(all)"] + DOMAINS, key="tbl_domain")
    if domain != "(all)":
        tables = [
            t for t in tables
            if any(r.domain == domain for r in BY_TABLE[t]["writes"] + BY_TABLE[t]["reads"])
        ]
    table = st.selectbox("Select a table", tables)
    info = BY_TABLE[table]
    writes, reads = info["writes"], info["reads"]

    st.subheader("Metadata")
    metadata_table([{
        "Qualified Table": table,
        "Written by (# jobs)": len(writes),
        "Read by (# jobs)": len(reads),
        "Domains involved": ", ".join(sorted({r.domain for r in writes + reads})),
        "Dialects involved": ", ".join(sorted({r.dialect for r in writes + reads})),
    }])

    st.subheader("Lineage")
    g = graphviz.Digraph()
    g.attr(rankdir="LR", fontname="Helvetica")
    g.attr("node", shape="box", style="rounded,filled", fontname="Helvetica")
    g.node(table, table, fillcolor="#FFE0B2")

    upstream = {r.source_object for r in writes if r.source_object}
    downstream = {r.target_object for r in reads}
    for src in sorted(upstream):
        g.node(src, src, fillcolor="#E3F2FD")
        g.edge(src, table, label=f"{sum(1 for r in writes if r.source_object == src)} jobs")
    for dst in sorted(downstream):
        g.node(dst, dst, fillcolor="#E8F5E9")
        g.edge(table, dst, label=f"{sum(1 for r in reads if r.target_object == dst)} jobs")
    st.graphviz_chart(g)

    if writes:
        st.subheader(f"Jobs that write to `{table}`")
        metadata_table([
            {
                "Job ID": r.job_id, "Job Type": r.job_type, "Dialect": r.dialect,
                "Source": r.source_object, "File": r.file_name,
            }
            for r in writes
        ])
    if reads:
        st.subheader(f"Jobs that read from `{table}`")
        metadata_table([
            {
                "Job ID": r.job_id, "Job Type": r.job_type, "Dialect": r.dialect,
                "Target": r.target_object, "File": r.file_name,
            }
            for r in reads
        ])


# ---------- Mode 3: Column-level lineage ----------

def render_column_lineage() -> None:
    st.header("Column-level Lineage with Metadata")
    # Pick a target table that we successfully extracted columns for.
    candidates = sorted({r.target_object for r in RECORDS if r.target_columns})
    domain = st.selectbox("Filter by domain", ["(all)"] + DOMAINS, key="col_domain")
    if domain != "(all)":
        candidates = [
            t for t in candidates
            if any(r.domain == domain for r in BY_TABLE[t]["writes"])
        ]
    table = st.selectbox("Target table", candidates)
    writers = [r for r in BY_TABLE[table]["writes"] if r.target_columns]
    rep = writers[0]  # column layout is identical across the templated jobs

    col_choice = st.selectbox("Target column", rep.target_columns)

    rows = []
    for r in writers:
        if col_choice in r.target_columns:
            idx = r.target_columns.index(col_choice)
            src_col = r.column_mapping[idx][0] if idx < len(r.column_mapping) else "—"
            rows.append({
                "Job ID": r.job_id,
                "Source Object": r.source_object or "—",
                "Source Column": src_col,
                "Target Column": col_choice,
                "Dialect": r.dialect,
                "Job Type": r.job_type,
            })

    st.subheader("Metadata")
    metadata_table(rows)

    st.subheader("Lineage")
    g = graphviz.Digraph()
    g.attr(rankdir="LR", fontname="Helvetica")
    g.attr("node", shape="box", style="rounded,filled", fontname="Helvetica")
    tgt_node = f"{table}.{col_choice}"
    g.node(tgt_node, tgt_node, fillcolor="#E8F5E9")
    # Distinct source-column nodes
    for r in writers:
        if col_choice not in r.target_columns:
            continue
        idx = r.target_columns.index(col_choice)
        src_col = r.column_mapping[idx][0] if idx < len(r.column_mapping) else None
        if not src_col or not r.source_object:
            continue
        src_node = f"{r.source_object}.{src_col}"
        g.node(src_node, src_node, fillcolor="#E3F2FD")
        g.edge(src_node, tgt_node, label=f"job {r.job_id}")
    st.graphviz_chart(g)


# ---------- Mode 4: Domain summary ----------

def render_domain_summary() -> None:
    st.header("Domain Summary")
    summary = domain_summary(RECORDS)
    overview_rows = [
        {
            "Domain": d,
            "Jobs": v["job_count"],
            "Tables": v["table_count"],
            "Job Types": ", ".join(f"{k}({n})" for k, n in v["job_types"].items()),
            "Dialects": ", ".join(f"{k}({n})" for k, n in v["dialects"].items()),
            "Source Objects": len(v["source_objects"]),
            "Target Objects": len(v["target_objects"]),
        }
        for d, v in sorted(summary.items())
    ]
    st.subheader("Overview")
    metadata_table(overview_rows)

    st.subheader("Drill into a domain")
    domain = st.selectbox("Domain", sorted(summary.keys()))
    v = summary[domain]
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**Source objects**")
        st.dataframe(pd.DataFrame({"Source": v["source_objects"]}),
                     use_container_width=True, hide_index=True)
    with c2:
        st.markdown("**Target objects**")
        st.dataframe(pd.DataFrame({"Target": v["target_objects"]}),
                     use_container_width=True, hide_index=True)

    st.subheader(f"Domain lineage: {domain}")
    g = graphviz.Digraph()
    g.attr(rankdir="LR", fontname="Helvetica")
    g.attr("node", shape="box", style="rounded,filled", fontname="Helvetica")
    edges_seen: set[tuple[str, str]] = set()
    for r in RECORDS:
        if r.domain != domain or not r.source_object:
            continue
        if (r.source_object, r.target_object) in edges_seen:
            continue
        edges_seen.add((r.source_object, r.target_object))
        g.node(r.source_object, r.source_object, fillcolor="#E3F2FD")
        g.node(r.target_object, r.target_object, fillcolor="#E8F5E9")
        n_jobs = sum(
            1 for x in RECORDS
            if x.domain == domain and x.source_object == r.source_object and x.target_object == r.target_object
        )
        g.edge(r.source_object, r.target_object, label=f"{n_jobs} jobs")
    st.graphviz_chart(g)


# ---------- Sidebar router ----------

MODES = {
    "Job-level Lineage with Metadata": render_job_lineage,
    "Table-level Lineage with Metadata": render_table_lineage,
    "Column-level Lineage with Metadata": render_column_lineage,
    "Domain Summary": render_domain_summary,
}

st.sidebar.title("Lineage Agent")
st.sidebar.caption(f"{len(RECORDS)} jobs parsed across {len(DOMAINS)} domains")
mode = st.sidebar.radio("Select a view", list(MODES.keys()))
MODES[mode]()
