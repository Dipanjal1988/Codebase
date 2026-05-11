#!/bin/bash
# FILE_NAME_CONTEXT: Verizon retail.store_sales aggregation lineage job
# JOB_ID: 458
# JOB_TYPE: aggregation
# DIALECT: unix_shell
# SOURCE_OBJECT: ftr_raw.retail_store_sales
# TARGET_OBJECT: vz_curated.retail_store_sales_aggregation
set -euo pipefail
JOB_ID="458"
JOB_NAME="vz_aggregation_retail_store_sales"
LANDING="gs://vz-ftr-landing/retail/store_sales"
ARCHIVE="gs://vz-ftr-archive/retail/store_sales"
RAW_TABLE="vz-agentic-198889:ftr_raw.retail_store_sales"

echo "Starting $JOB_NAME"
mkdir -p /tmp/$JOB_NAME
gsutil -m cp "$LANDING/*.csv" "/tmp/$JOB_NAME/" || true

bq load --source_format=CSV --skip_leading_rows=1 --autodetect "$RAW_TABLE" "/tmp/$JOB_NAME/*.csv"

bq query --use_legacy_sql=false <<SQL
CREATE OR REPLACE TABLE `vz-agentic-198889.vz_curated.retail_store_sales_aggregation` AS
SELECT *, CURRENT_TIMESTAMP() AS lineage_load_ts, 458 AS lineage_job_id
FROM `vz-agentic-198889.ftr_raw.retail_store_sales`
WHERE COALESCE(record_status, 'ACTIVE') = 'ACTIVE';

INSERT INTO `vz-agentic-198889.audit_control.table_lineage`
(job_id, job_name, source_object, target_object, domain_name, job_type, dialect_name, observed_ts)
VALUES(458, '$JOB_NAME', 'ftr_raw.retail_store_sales', 'vz_curated.retail_store_sales_aggregation', 'retail', 'aggregation', 'unix_shell', CURRENT_TIMESTAMP());
SQL

gsutil -m mv "$LANDING/*.csv" "$ARCHIVE/run_id=$(date +%Y%m%d%H%M%S)/" || true
echo "Completed $JOB_NAME"
# lineage_detail_001: source to target dependency retained for parser validation
# lineage_detail_002: source to target dependency retained for parser validation
# lineage_detail_003: source to target dependency retained for parser validation
# lineage_detail_004: source to target dependency retained for parser validation
# lineage_detail_005: source to target dependency retained for parser validation
# lineage_detail_006: source to target dependency retained for parser validation
# lineage_detail_007: source to target dependency retained for parser validation
# lineage_detail_008: source to target dependency retained for parser validation
# lineage_detail_009: source to target dependency retained for parser validation
# lineage_detail_010: source to target dependency retained for parser validation
# lineage_detail_011: source to target dependency retained for parser validation
# lineage_detail_012: source to target dependency retained for parser validation
# lineage_detail_013: source to target dependency retained for parser validation
# lineage_detail_014: source to target dependency retained for parser validation
# lineage_detail_015: source to target dependency retained for parser validation
# lineage_detail_016: source to target dependency retained for parser validation
# lineage_detail_017: source to target dependency retained for parser validation
# lineage_detail_018: source to target dependency retained for parser validation
# lineage_detail_019: source to target dependency retained for parser validation
# lineage_detail_020: source to target dependency retained for parser validation
# lineage_detail_021: source to target dependency retained for parser validation
# lineage_detail_022: source to target dependency retained for parser validation
# lineage_detail_023: source to target dependency retained for parser validation
# lineage_detail_024: source to target dependency retained for parser validation
# lineage_detail_025: source to target dependency retained for parser validation
# lineage_detail_026: source to target dependency retained for parser validation
# lineage_detail_027: source to target dependency retained for parser validation
# lineage_detail_028: source to target dependency retained for parser validation
# lineage_detail_029: source to target dependency retained for parser validation
# lineage_detail_030: source to target dependency retained for parser validation
# lineage_detail_031: source to target dependency retained for parser validation
# lineage_detail_032: source to target dependency retained for parser validation
# lineage_detail_033: source to target dependency retained for parser validation
# lineage_detail_034: source to target dependency retained for parser validation
# lineage_detail_035: source to target dependency retained for parser validation
# lineage_detail_036: source to target dependency retained for parser validation
# lineage_detail_037: source to target dependency retained for parser validation
# lineage_detail_038: source to target dependency retained for parser validation
# lineage_detail_039: source to target dependency retained for parser validation
# lineage_detail_040: source to target dependency retained for parser validation
# lineage_detail_041: source to target dependency retained for parser validation
# lineage_detail_042: source to target dependency retained for parser validation
# lineage_detail_043: source to target dependency retained for parser validation
# lineage_detail_044: source to target dependency retained for parser validation
# lineage_detail_045: source to target dependency retained for parser validation
# lineage_detail_046: source to target dependency retained for parser validation
# lineage_detail_047: source to target dependency retained for parser validation
# lineage_detail_048: source to target dependency retained for parser validation
# lineage_detail_049: source to target dependency retained for parser validation
# lineage_detail_050: source to target dependency retained for parser validation
# lineage_detail_051: source to target dependency retained for parser validation
# lineage_detail_052: source to target dependency retained for parser validation
# lineage_detail_053: source to target dependency retained for parser validation
# lineage_detail_054: source to target dependency retained for parser validation
# lineage_detail_055: source to target dependency retained for parser validation
# lineage_detail_056: source to target dependency retained for parser validation
# lineage_detail_057: source to target dependency retained for parser validation
# lineage_detail_058: source to target dependency retained for parser validation
# lineage_detail_059: source to target dependency retained for parser validation
# lineage_detail_060: source to target dependency retained for parser validation
# lineage_detail_061: source to target dependency retained for parser validation
# lineage_detail_062: source to target dependency retained for parser validation
# lineage_detail_063: source to target dependency retained for parser validation
# lineage_detail_064: source to target dependency retained for parser validation
# lineage_detail_065: source to target dependency retained for parser validation
# lineage_detail_066: source to target dependency retained for parser validation
# lineage_detail_067: source to target dependency retained for parser validation
# lineage_detail_068: source to target dependency retained for parser validation
# lineage_detail_069: source to target dependency retained for parser validation
# lineage_detail_070: source to target dependency retained for parser validation
# lineage_detail_071: source to target dependency retained for parser validation
# lineage_detail_072: source to target dependency retained for parser validation
# lineage_detail_073: source to target dependency retained for parser validation
# lineage_detail_074: source to target dependency retained for parser validation
# lineage_detail_075: source to target dependency retained for parser validation
# lineage_detail_076: source to target dependency retained for parser validation
# lineage_detail_077: source to target dependency retained for parser validation
