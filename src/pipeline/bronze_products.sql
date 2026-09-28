CREATE OR REFRESH STREAMING TABLE bronze_products
COMMENT 'Synthetic raw product dimension from a governed volume'
AS SELECT *, current_timestamp() AS ingested_at, _metadata.file_path AS source_file
FROM STREAM read_files('${raw_root}/products/', format => 'parquet');
