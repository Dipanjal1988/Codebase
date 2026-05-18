"""Thin wrapper around the BigQuery `bq` CLI.

We shell out to `bq ... --format=json` and parse the result. This keeps the
dependency surface zero (no `google-cloud-bigquery` SDK) and lets the user
authenticate however they normally do (`gcloud auth application-default
login`, service account JSON via `GOOGLE_APPLICATION_CREDENTIALS`, etc.).
"""
from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from typing import Optional


class BQError(RuntimeError):
    """Raised when the bq CLI is missing, fails, or returns unparseable output."""


@dataclass
class Dataset:
    project_id: str
    dataset_id: str

    @property
    def qualified(self) -> str:
        return f"{self.project_id}:{self.dataset_id}"


@dataclass
class Table:
    project_id: str
    dataset_id: str
    table_id: str
    table_type: str  # "TABLE", "VIEW", "MATERIALIZED_VIEW", ...

    @property
    def qualified(self) -> str:
        return f"{self.project_id}.{self.dataset_id}.{self.table_id}"


def bq_available() -> bool:
    return shutil.which("bq") is not None


def _run(args: list[str], timeout: int = 30) -> str:
    if not bq_available():
        raise BQError(
            "`bq` CLI not found on PATH. Install the Google Cloud SDK "
            "(https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`."
        )
    try:
        result = subprocess.run(
            ["bq", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as e:
        raise BQError(f"bq command timed out after {timeout}s: bq {' '.join(args)}") from e

    if result.returncode != 0:
        raise BQError(
            f"bq command failed (exit {result.returncode}):\n"
            f"  cmd: bq {' '.join(args)}\n"
            f"  stderr: {result.stderr.strip() or result.stdout.strip()}"
        )
    return result.stdout


def current_project() -> Optional[str]:
    """Return the default project from `bq` config, or None if unset."""
    try:
        out = _run(["show", "--format=prettyjson", "--project_id="], timeout=10)
    except BQError:
        # Fall back to gcloud config if bq show fails
        try:
            result = subprocess.run(
                ["gcloud", "config", "get-value", "project"],
                capture_output=True, text=True, timeout=10, check=False,
            )
            val = result.stdout.strip()
            return val or None
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return None
    try:
        return json.loads(out).get("projectReference", {}).get("projectId")
    except json.JSONDecodeError:
        return None


def list_datasets(project_id: Optional[str] = None) -> list[Dataset]:
    args = ["ls", "--format=json", "--max_results=1000"]
    if project_id:
        args.append(f"--project_id={project_id}")
    out = _run(args)
    try:
        raw = json.loads(out) if out.strip() else []
    except json.JSONDecodeError as e:
        raise BQError(f"Could not parse `bq ls` output as JSON: {e}") from e

    datasets: list[Dataset] = []
    for item in raw:
        ref = item.get("datasetReference", {})
        ds_project = ref.get("projectId") or project_id or ""
        ds_id = ref.get("datasetId") or item.get("id", "").split(":")[-1]
        if ds_id:
            datasets.append(Dataset(project_id=ds_project, dataset_id=ds_id))
    return datasets


def list_tables(dataset: Dataset) -> list[Table]:
    out = _run([
        "ls",
        "--format=json",
        "--max_results=10000",
        f"{dataset.project_id}:{dataset.dataset_id}",
    ])
    try:
        raw = json.loads(out) if out.strip() else []
    except json.JSONDecodeError as e:
        raise BQError(f"Could not parse `bq ls` table output as JSON: {e}") from e

    tables: list[Table] = []
    for item in raw:
        ref = item.get("tableReference", {})
        tbl_id = ref.get("tableId") or item.get("tableId")
        if not tbl_id:
            continue
        tables.append(Table(
            project_id=ref.get("projectId", dataset.project_id),
            dataset_id=ref.get("datasetId", dataset.dataset_id),
            table_id=tbl_id,
            table_type=item.get("type", "TABLE"),
        ))
    return tables
