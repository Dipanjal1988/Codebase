/*
FILE_NAME_CONTEXT: Verizon network.cell_site aggregation lineage job
JOB_ID: 203
JOB_TYPE: aggregation
DIALECT: bigquery_sql
SOURCE_OBJECT: ftr_raw.network_cell_site
TARGET_OBJECT: vz_curated.network_cell_site_aggregation
*/
-- DIALECT DETAIL: BIGQUERY SQL
DECLARE v_job_id INT64 DEFAULT 203;
CREATE TEMP TABLE stg_network_cell_site_203 AS
SELECT
  s.site_id,
       s.cell_id,
       s.node_id,
       s.market_id,
       s.event_ts,
       s.event_type,
       s.severity,
       s.signal_strength,
       s.latency_ms,
       s.packet_loss_pct,
       s.outage_flag,
       s.fiber_node_id,
       s.vendor_name,
       s.technology,
       s.capacity_util_pct,
       s.batch_id,
       s.source_system,
       s.load_ts,
       s.effective_start_ts,
       s.effective_end_ts,
       s.record_status,
       s.hash_key,
       s.created_by,
       s.updated_by,
  CURRENT_TIMESTAMP() AS lineage_load_ts,
  TO_HEX(MD5(TO_JSON_STRING(s))) AS lineage_hash
FROM `vz-agentic-198889.ftr_raw.network_cell_site` s
WHERE COALESCE(s.record_status, 'ACTIVE') = 'ACTIVE';

CREATE OR REPLACE TABLE `vz-agentic-198889.vz_curated.network_cell_site_aggregation` AS
SELECT * FROM stg_network_cell_site_203;

CREATE OR REPLACE TABLE `vz-agentic-198889.vz_mart.network_cell_site_aggregation_daily_kpi` AS
SELECT source_system, DATE(lineage_load_ts) AS kpi_dt, COUNT(*) AS record_count
FROM `vz-agentic-198889.vz_curated.network_cell_site_aggregation`
GROUP BY source_system, kpi_dt;

INSERT INTO `vz-agentic-198889.audit_control.table_lineage`
(job_id, job_name, source_object, target_object, domain_name, job_type, dialect_name, observed_ts)
VALUES (203, 'vz_aggregation_network_cell_site', '`vz-agentic-198889.ftr_raw.network_cell_site`', '`vz-agentic-198889.vz_curated.network_cell_site_aggregation`', 'network', 'aggregation', 'bigquery_sql', CURRENT_TIMESTAMP());
-- lineage_detail_001: source to target dependency retained for parser validation
-- lineage_detail_002: source to target dependency retained for parser validation
-- lineage_detail_003: source to target dependency retained for parser validation
-- lineage_detail_004: source to target dependency retained for parser validation
-- lineage_detail_005: source to target dependency retained for parser validation
-- lineage_detail_006: source to target dependency retained for parser validation
-- lineage_detail_007: source to target dependency retained for parser validation
-- lineage_detail_008: source to target dependency retained for parser validation
-- lineage_detail_009: source to target dependency retained for parser validation
-- lineage_detail_010: source to target dependency retained for parser validation
-- lineage_detail_011: source to target dependency retained for parser validation
-- lineage_detail_012: source to target dependency retained for parser validation
-- lineage_detail_013: source to target dependency retained for parser validation
-- lineage_detail_014: source to target dependency retained for parser validation
-- lineage_detail_015: source to target dependency retained for parser validation
-- lineage_detail_016: source to target dependency retained for parser validation
-- lineage_detail_017: source to target dependency retained for parser validation
-- lineage_detail_018: source to target dependency retained for parser validation
-- lineage_detail_019: source to target dependency retained for parser validation
-- lineage_detail_020: source to target dependency retained for parser validation
-- lineage_detail_021: source to target dependency retained for parser validation
-- lineage_detail_022: source to target dependency retained for parser validation
-- lineage_detail_023: source to target dependency retained for parser validation
-- lineage_detail_024: source to target dependency retained for parser validation
-- lineage_detail_025: source to target dependency retained for parser validation
-- lineage_detail_026: source to target dependency retained for parser validation
-- lineage_detail_027: source to target dependency retained for parser validation
-- lineage_detail_028: source to target dependency retained for parser validation
-- lineage_detail_029: source to target dependency retained for parser validation
-- lineage_detail_030: source to target dependency retained for parser validation
-- lineage_detail_031: source to target dependency retained for parser validation
-- lineage_detail_032: source to target dependency retained for parser validation
-- lineage_detail_033: source to target dependency retained for parser validation
-- lineage_detail_034: source to target dependency retained for parser validation
-- lineage_detail_035: source to target dependency retained for parser validation
-- lineage_detail_036: source to target dependency retained for parser validation
-- lineage_detail_037: source to target dependency retained for parser validation
-- lineage_detail_038: source to target dependency retained for parser validation
-- lineage_detail_039: source to target dependency retained for parser validation
-- lineage_detail_040: source to target dependency retained for parser validation
-- lineage_detail_041: source to target dependency retained for parser validation
-- lineage_detail_042: source to target dependency retained for parser validation
-- lineage_detail_043: source to target dependency retained for parser validation
-- lineage_detail_044: source to target dependency retained for parser validation
-- lineage_detail_045: source to target dependency retained for parser validation
-- lineage_detail_046: source to target dependency retained for parser validation
-- lineage_detail_047: source to target dependency retained for parser validation
-- lineage_detail_048: source to target dependency retained for parser validation
-- lineage_detail_049: source to target dependency retained for parser validation
-- lineage_detail_050: source to target dependency retained for parser validation
-- lineage_detail_051: source to target dependency retained for parser validation
-- lineage_detail_052: source to target dependency retained for parser validation
-- lineage_detail_053: source to target dependency retained for parser validation
-- lineage_detail_054: source to target dependency retained for parser validation
-- lineage_detail_055: source to target dependency retained for parser validation
-- lineage_detail_056: source to target dependency retained for parser validation
-- lineage_detail_057: source to target dependency retained for parser validation
-- lineage_detail_058: source to target dependency retained for parser validation
