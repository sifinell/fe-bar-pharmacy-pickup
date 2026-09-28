CREATE OR REFRESH STREAMING TABLE bronze_pickup_orders
COMMENT 'Synthetic raw pickup orders including observed outcome and lost margin'
AS SELECT *, current_timestamp() AS ingested_at, _metadata.file_path AS source_file
FROM STREAM read_files('${raw_root}/pickup_orders/', format => 'parquet');
