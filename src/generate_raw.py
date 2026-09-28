"""Generate deterministic, wholly synthetic pharmacy pickup source files.

Run with Python 3.12, Databricks Connect, and an explicit CLI profile.
Writes raw Parquet to the selected Unity Catalog volume; no customer data is used.
"""

import argparse
import re
from databricks.connect import DatabricksSession
from pyspark.sql import functions as F


VOLUME = "raw_sources"
START_DATE = "2026-09-16"


def rand_mod(column: str, seed: int, modulus: int):
    return F.pmod(F.hash(F.col(column), F.lit(seed)), F.lit(modulus))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", required=True, help="Approved Unity Catalog catalog")
    parser.add_argument("--schema", default="pickup_operations", help="Dedicated synthetic-data schema")
    args = parser.parse_args()
    for name in (args.catalog, args.schema):
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
            parser.error(f"Invalid Unity Catalog identifier: {name!r}")
    root = f"/Volumes/{args.catalog}/{args.schema}/{VOLUME}"
    spark = DatabricksSession.builder.serverless(True).getOrCreate()
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS {args.catalog}.{args.schema}")
    spark.sql(f"CREATE VOLUME IF NOT EXISTS {args.catalog}.{args.schema}.{VOLUME}")

    stores = (
        spark.range(25, numPartitions=8)
        .select(F.col("id").cast("int").alias("store_id"))
        .withColumn("store_name", F.concat(F.lit("Fictional Pharmacy "), F.lpad((F.col("store_id") + 1).cast("string"), 2, "0")))
        .withColumn("region", F.when(F.col("store_id") < 5, "North").when(F.col("store_id") < 15, "Central").otherwise("South"))
    )
    stores.write.mode("overwrite").parquet(f"{root}/stores")

    products = (
        spark.range(400, numPartitions=8)
        .select(F.col("id").cast("int").alias("product_id"))
        .withColumn("category", F.when(F.col("product_id") < 80, "Cold & flu").when(F.col("product_id") < 160, "Wellness").when(F.col("product_id") < 240, "Personal care").when(F.col("product_id") < 320, "First aid").otherwise("Everyday care"))
        .withColumn("product_name", F.concat(F.col("category"), F.lit(" item "), F.lpad((F.col("product_id") + 1).cast("string"), 3, "0")))
        .withColumn("unit_price_eur", (F.lit(5.0) + F.pmod(F.col("product_id") * 7, F.lit(40)) * F.lit(0.5)).cast("decimal(10,2)"))
        .withColumn("unit_margin_eur", (F.col("unit_price_eur") * F.lit(0.32)).cast("decimal(10,2)"))
    )
    products.write.mode("overwrite").parquet(f"{root}/products")

    inventory = (
        spark.range(100_000, numPartitions=16)
        .select(
            (F.col("id") / 10_000).cast("int").alias("day_index"),
            ((F.col("id") % 10_000) / 400).cast("int").alias("store_id"),
            (F.col("id") % 400).cast("int").alias("product_id"),
        )
        .withColumn("snapshot_date", F.date_add(F.lit(START_DATE).cast("date"), F.col("day_index")))
        .withColumn("disruption", (F.col("store_id") < 5) & (F.col("product_id") < 80) & (F.col("day_index") >= 5))
        .withColumn("baseline_exception", F.pmod(F.hash("store_id", "product_id", "day_index", F.lit(97)), F.lit(100)) < 3)
        .withColumn("available_units", F.when(F.col("disruption"), F.pmod(F.hash("store_id", "product_id", "day_index"), F.lit(4))).when(F.col("baseline_exception"), F.pmod(F.hash("store_id", "product_id", "day_index", F.lit(101)), F.lit(3))).otherwise(F.lit(8) + F.pmod(F.hash("store_id", "product_id", "day_index"), F.lit(31))))
        .select("snapshot_date", "day_index", "store_id", "product_id", "available_units", "disruption")
    )
    inventory.write.mode("overwrite").parquet(f"{root}/inventory")

    orders = (
        spark.range(120_000, numPartitions=16)
        .select(F.col("id").alias("order_id"))
        .withColumn("store_draw", rand_mod("order_id", 11, 100))
        .withColumn("store_id", F.when(F.col("store_draw") < 35, rand_mod("order_id", 13, 5)).otherwise(F.lit(5) + rand_mod("order_id", 17, 20)).cast("int"))
        .withColumn("product_draw", rand_mod("order_id", 19, 100))
        .withColumn("product_id", F.when(F.col("product_draw") < 80, rand_mod("order_id", 23, 80)).otherwise(F.lit(80) + rand_mod("order_id", 29, 320)).cast("int"))
        .withColumn("day_index", rand_mod("order_id", 31, 10).cast("int"))
        .withColumn("order_date", F.date_add(F.lit(START_DATE).cast("date"), F.col("day_index")))
        .withColumn("quantity", (F.lit(1) + rand_mod("order_id", 37, 3)).cast("int"))
        .join(inventory.select("day_index", "store_id", "product_id", "available_units"), ["day_index", "store_id", "product_id"], "left")
        .join(products.select("product_id", "unit_price_eur", "unit_margin_eur"), "product_id", "left")
        .withColumn("pickup_status", F.when(F.col("available_units") < F.col("quantity"), "missed").when((F.col("available_units") <= 3) & (rand_mod("order_id", 41, 100) < 40), "substituted").otherwise("ready"))
        .withColumn("lost_margin_eur", F.when(F.col("pickup_status") == "missed", F.col("unit_margin_eur") * F.col("quantity")).otherwise(F.lit(0)).cast("decimal(12,2)"))
        .select("order_id", "order_date", "store_id", "product_id", "quantity", "pickup_status", "available_units", "unit_price_eur", "unit_margin_eur", "lost_margin_eur")
    )
    orders.write.mode("overwrite").parquet(f"{root}/pickup_orders")

    deliveries = (
        spark.range(20_000, numPartitions=8)
        .select(F.col("id").alias("delivery_id"))
        .withColumn("store_id", rand_mod("delivery_id", 43, 25).cast("int"))
        .withColumn("product_id", rand_mod("delivery_id", 47, 400).cast("int"))
        .withColumn("day_index", rand_mod("delivery_id", 53, 10).cast("int"))
        .withColumn("delivery_date", F.date_add(F.lit(START_DATE).cast("date"), F.col("day_index")))
        .withColumn("delay_hours", F.when((F.col("store_id") < 5) & (F.col("product_id") < 80) & (F.col("day_index") >= 5), F.lit(24) + rand_mod("delivery_id", 59, 49)).otherwise(rand_mod("delivery_id", 61, 5)).cast("int"))
        .select("delivery_id", "delivery_date", "store_id", "product_id", "delay_hours")
    )
    deliveries.write.mode("overwrite").parquet(f"{root}/deliveries")

    print("Synthetic raw Parquet generation complete.")
    print(f"Volume: {root}")
    print("Expected rows: stores=25, products=400, inventory=100000, pickup_orders=120000, deliveries=20000")
    print("Incident: North stores 0-4, Cold & flu products 0-79, days 5-9 have low stock and long supplier delays.")


if __name__ == "__main__":
    main()
