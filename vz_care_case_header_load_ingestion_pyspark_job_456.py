# FILE_NAME_CONTEXT: Verizon care.case_header ingestion lineage job
# JOB_ID: 456
# JOB_TYPE: ingestion
# DIALECT: pyspark
# SOURCE_OBJECT: ftr_raw.care_case_header
# TARGET_OBJECT: vz_curated.care_case_header_ingestion
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit, current_timestamp, sha2, concat_ws, coalesce, count

spark = SparkSession.builder.appName("vz_ingestion_care_case_header_456").getOrCreate()
job_id = 456
source_path = "gs://vz-ftr-landing/care/case_header/"
target_path = "gs://vz-curated/care/case_header_ingestion/"

raw_df = spark.read.format("parquet").load(source_path)
filtered_df = raw_df.filter(coalesce(col("record_status"), lit("ACTIVE")) == lit("ACTIVE"))

selected_df = filtered_df.select(
    col("case_id"),
    col("customer_id"),
    col("agent_id"),
    col("interaction_id"),
    col("case_status"),
    col("case_reason"),
    col("open_ts"),
    col("close_ts"),
    col("resolution_code"),
    col("nps_score"),
    col("contact_channel"),
    col("transfer_count"),
    col("handle_time_sec"),
    col("escalation_flag"),
    col("batch_id"),
    col("source_system"),
    col("load_ts"),
    col("effective_start_ts"),
    col("effective_end_ts"),
    col("record_status"),
    col("hash_key"),
    col("created_by"),
    col("updated_by"),
    col("case_header_attr_1"),
)

curated_df = (
    selected_df
    .withColumn("lineage_load_ts", current_timestamp())
    .withColumn("lineage_job_id", lit(job_id))
    .withColumn("lineage_hash", sha2(concat_ws("|", *[col(c).cast("string") for c in ['case_id', 'customer_id', 'agent_id', 'interaction_id', 'case_status']]), 256))
)

curated_df.write.format("delta").mode("overwrite").save(target_path)

summary_df = curated_df.groupBy("source_system").agg(count(lit(1)).alias("record_count"))
summary_df.write.format("bigquery").option("table", "vz-agentic-198889.vz_mart.care_case_header_ingestion_summary").mode("append").save()

lineage_df = spark.createDataFrame(
    [(456, "vz_ingestion_care_case_header", "ftr_raw.care_case_header", "vz_curated.care_case_header_ingestion", "care", "ingestion", "pyspark")],
    "job_id long, job_name string, source_object string, target_object string, domain_name string, job_type string, dialect_name string"
)
lineage_df.write.format("bigquery").option("table", "vz-agentic-198889.audit_control.table_lineage").mode("append").save()
spark.stop()
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
