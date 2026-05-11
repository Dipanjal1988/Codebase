/*
FILE_NAME_CONTEXT: Verizon billing.bill_adjustment curation lineage job
JOB_ID: 282
JOB_TYPE: curation
DIALECT: oracle_plsql
SOURCE_OBJECT: ftr_raw.billing_bill_adjustment
TARGET_OBJECT: vz_curated.billing_bill_adjustment_curation
*/
CREATE OR REPLACE PROCEDURE vz_curation_billing_bill_adjustment_p AS
  v_job_id NUMBER := 282;
BEGIN
  INSERT INTO audit_control.job_run_log(job_id, job_name, domain_name, run_status, start_ts)
  VALUES(v_job_id, 'vz_curation_billing_bill_adjustment', 'billing', 'STARTED', SYSTIMESTAMP);

  DELETE FROM vz_curated.billing_bill_adjustment_curation t
   WHERE EXISTS (SELECT 1 FROM ftr_raw.billing_bill_adjustment s WHERE s.billing_account_id = t.billing_account_id);

  INSERT INTO vz_curated.billing_bill_adjustment_curation (billing_account_id, invoice_id, cycle_code, bill_period_start_dt, bill_period_end_dt, charge_amt, tax_amt, discount_amt, payment_amt, balance_amt, currency_code, payment_status, autopay_flag, late_fee_amt, adjustment_reason, batch_id, source_system, load_ts, effective_start_ts, effective_end_ts, record_status, hash_key, created_by, updated_by, lineage_load_ts, lineage_job_id)
  SELECT s.billing_account_id,
       s.invoice_id,
       s.cycle_code,
       s.bill_period_start_dt,
       s.bill_period_end_dt,
       s.charge_amt,
       s.tax_amt,
       s.discount_amt,
       s.payment_amt,
       s.balance_amt,
       s.currency_code,
       s.payment_status,
       s.autopay_flag,
       s.late_fee_amt,
       s.adjustment_reason,
       s.batch_id,
       s.source_system,
       s.load_ts,
       s.effective_start_ts,
       s.effective_end_ts,
       s.record_status,
       s.hash_key,
       s.created_by,
       s.updated_by, SYSTIMESTAMP, v_job_id
  FROM ftr_raw.billing_bill_adjustment s
  WHERE NVL(s.record_status, 'ACTIVE') = 'ACTIVE';

  INSERT INTO audit_control.table_lineage
  (job_id, job_name, source_object, target_object, domain_name, job_type, dialect_name, observed_ts)
  VALUES(v_job_id, 'vz_curation_billing_bill_adjustment', 'ftr_raw.billing_bill_adjustment', 'vz_curated.billing_bill_adjustment_curation', 'billing', 'curation', 'oracle_plsql', SYSTIMESTAMP);

  COMMIT;
EXCEPTION WHEN OTHERS THEN
  ROLLBACK;
  RAISE;
END;
/
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
