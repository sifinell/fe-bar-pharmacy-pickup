CREATE OR REFRESH STREAMING TABLE bronze_deliveries
COMMENT 'Synthetic inbound supplier delivery events'
AS SELECT *, current_timestamp() AS ingested_at, _metadata.file_path AS source_file
FROM STREAM read_files('${raw_root}/deliveries/', format => 'parquet');
