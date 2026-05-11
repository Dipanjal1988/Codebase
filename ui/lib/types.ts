export type ColumnMapping = [string, string];

export interface JobRecord {
  file_name: string;
  file_path: string;
  job_id: number;
  job_type: string;
  dialect: string;
  domain: string;
  table: string;
  source_object: string;
  target_object: string;
  description: string;
  source_columns: string[];
  target_columns: string[];
  column_mapping: ColumnMapping[];
  narrative: string;
}

export interface TableEntry {
  qualified: string;
  role: string;
  domains: string[];
  writes: { job_id: number; source: string; dialect: string; job_type: string; file: string }[];
  reads: { job_id: number; target: string; dialect: string; job_type: string; file: string }[];
  narrative: string;
}

export interface ColumnEntry {
  target_table: string;
  column: string;
  mapping: {
    job_id: number;
    source_object: string;
    source_column: string | null;
    dialect: string;
    job_type: string;
  }[];
  narrative: string;
}

export interface DomainEntry {
  domain: string;
  job_count: number;
  table_count: number;
  job_types: Record<string, number>;
  dialects: Record<string, number>;
  source_objects: string[];
  target_objects: string[];
  edges: { source: string; target: string; job_count: number }[];
  narrative: string;
}

export interface LineageData {
  jobs: JobRecord[];
  tables: TableEntry[];
  columns: ColumnEntry[];
  domains: DomainEntry[];
  generated_from: string;
}
