CREATE OR REFRESH STREAMING TABLE bronze_inventory
COMMENT 'Synthetic daily available-to-promise snapshots'
AS SELECT *, current_timestamp() AS ingested_at, _metadata.file_path AS source_file
FROM STREAM read_files('${raw_root}/inventory/', format => 'parquet');
