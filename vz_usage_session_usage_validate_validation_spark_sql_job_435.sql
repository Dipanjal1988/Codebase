/*
FILE_NAME_CONTEXT: Verizon usage.session_usage validation lineage job
JOB_ID: 435
JOB_TYPE: validation
DIALECT: spark_sql
SOURCE_OBJECT: ftr_raw.usage_session_usage
TARGET_OBJECT: vz_curated.usage_session_usage_validation
*/
-- DIALECT DETAIL: SPARK SQL
CREATE OR REPLACE TEMP VIEW stg_usage_session_usage_435 AS
SELECT
  s.usage_id,
       s.customer_id,
       s.msisdn,
       s.session_id,
       s.usage_start_ts,
       s.usage_end_ts,
       s.duration_sec,
       s.bytes_uplink,
       s.bytes_downlink,
       s.rated_amt,
       s.roaming_flag,
       s.network_type,
       s.country_code,
       s.imei,
       s.imsi,
       s.batch_id,
       s.source_system,
       s.load_ts,
       s.effective_start_ts,
       s.effective_end_ts,
       s.record_status,
       s.hash_key,
       s.created_by,
       s.updated_by,
  CURRENT_TIMESTAMP AS lineage_load_ts,
  MD5(CONCAT(usage_id, customer_id, msisdn, session_id, usage_start_ts)) AS lineage_hash
FROM ftr_raw.usage_session_usage s
WHERE COALESCE(s.record_status, 'ACTIVE') = 'ACTIVE';

MERGE INTO vz_curated.usage_session_usage_validation t
USING stg_usage_session_usage_435 s
ON t.usage_id = s.usage_id
WHEN MATCHED THEN UPDATE SET lineage_load_ts = s.lineage_load_ts
WHEN NOT MATCHED THEN INSERT (usage_id, customer_id, msisdn, session_id, usage_start_ts, usage_end_ts, duration_sec, bytes_uplink, bytes_downlink, rated_amt, roaming_flag, network_type, country_code, imei, imsi, batch_id, source_system, load_ts, effective_start_ts, effective_end_ts, record_status, hash_key, created_by, updated_by, lineage_load_ts, lineage_hash)
VALUES (s.usage_id, s.customer_id, s.msisdn, s.session_id, s.usage_start_ts, s.usage_end_ts, s.duration_sec, s.bytes_uplink, s.bytes_downlink, s.rated_amt, s.roaming_flag, s.network_type, s.country_code, s.imei, s.imsi, s.batch_id, s.source_system, s.load_ts, s.effective_start_ts, s.effective_end_ts, s.record_status, s.hash_key, s.created_by, s.updated_by, s.lineage_load_ts, s.lineage_hash);

CREATE OR REPLACE TABLE vz_mart.usage_session_usage_validation_summary AS
SELECT source_system, COUNT(*) AS record_count, MAX(lineage_load_ts) AS latest_load_ts
FROM vz_curated.usage_session_usage_validation
GROUP BY source_system;

INSERT INTO audit_control.table_lineage
SELECT 435, 'vz_validation_usage_session_usage', 'ftr_raw.usage_session_usage', 'vz_curated.usage_session_usage_validation', 'usage', 'validation', 'spark_sql', CURRENT_TIMESTAMP;
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
