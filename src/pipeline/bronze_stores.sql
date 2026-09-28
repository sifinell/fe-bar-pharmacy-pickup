CREATE OR REFRESH STREAMING TABLE bronze_stores
COMMENT 'Synthetic raw store dimension from a governed volume'
AS SELECT *, current_timestamp() AS ingested_at, _metadata.file_path AS source_file
FROM STREAM read_files('${raw_root}/stores/', format => 'parquet');
