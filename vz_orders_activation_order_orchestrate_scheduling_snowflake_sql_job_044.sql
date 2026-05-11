/*
FILE_NAME_CONTEXT: Verizon orders.activation_order scheduling lineage job
JOB_ID: 44
JOB_TYPE: scheduling
DIALECT: snowflake_sql
SOURCE_OBJECT: ftr_raw.orders_activation_order
TARGET_OBJECT: vz_curated.orders_activation_order_scheduling
*/
-- DIALECT DETAIL: SNOWFLAKE SQL
CREATE OR REPLACE TEMP VIEW stg_orders_activation_order_44 AS
SELECT
  s.order_id,
       s.order_line_id,
       s.customer_id,
       s.product_id,
       s.order_status,
       s.order_channel,
       s.submitted_ts,
       s.completed_ts,
       s.activation_ts,
       s.fulfillment_status,
       s.ship_tracking_id,
       s.sales_rep_id,
       s.store_id,
       s.install_type,
       s.batch_id,
       s.source_system,
       s.load_ts,
       s.effective_start_ts,
       s.effective_end_ts,
       s.record_status,
       s.hash_key,
       s.created_by,
       s.updated_by,
       s.activation_order_attr_1,
  CURRENT_TIMESTAMP AS lineage_load_ts,
  MD5(CONCAT(order_id, order_line_id, customer_id, product_id, order_status)) AS lineage_hash
FROM ftr_raw.orders_activation_order s
WHERE COALESCE(s.record_status, 'ACTIVE') = 'ACTIVE';

MERGE INTO vz_curated.orders_activation_order_scheduling t
USING stg_orders_activation_order_44 s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET lineage_load_ts = s.lineage_load_ts
WHEN NOT MATCHED THEN INSERT (order_id, order_line_id, customer_id, product_id, order_status, order_channel, submitted_ts, completed_ts, activation_ts, fulfillment_status, ship_tracking_id, sales_rep_id, store_id, install_type, batch_id, source_system, load_ts, effective_start_ts, effective_end_ts, record_status, hash_key, created_by, updated_by, activation_order_attr_1, lineage_load_ts, lineage_hash)
VALUES (s.order_id, s.order_line_id, s.customer_id, s.product_id, s.order_status, s.order_channel, s.submitted_ts, s.completed_ts, s.activation_ts, s.fulfillment_status, s.ship_tracking_id, s.sales_rep_id, s.store_id, s.install_type, s.batch_id, s.source_system, s.load_ts, s.effective_start_ts, s.effective_end_ts, s.record_status, s.hash_key, s.created_by, s.updated_by, s.activation_order_attr_1, s.lineage_load_ts, s.lineage_hash);

CREATE OR REPLACE TABLE vz_mart.orders_activation_order_scheduling_summary AS
SELECT source_system, COUNT(*) AS record_count, MAX(lineage_load_ts) AS latest_load_ts
FROM vz_curated.orders_activation_order_scheduling
GROUP BY source_system;

INSERT INTO audit_control.table_lineage
SELECT 44, 'vz_scheduling_orders_activation_order', 'ftr_raw.orders_activation_order', 'vz_curated.orders_activation_order_scheduling', 'orders', 'scheduling', 'snowflake_sql', CURRENT_TIMESTAMP;
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
