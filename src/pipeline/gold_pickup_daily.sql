CREATE OR REFRESH MATERIALIZED VIEW gold_pickup_daily
COMMENT 'Daily pickup service outcomes and margin exposure by store and category'
AS SELECT order_date, store_id, store_name, region, category,
          count(*) AS order_count,
          sum(CASE WHEN pickup_status = 'missed' THEN 1 ELSE 0 END) AS missed_orders,
          sum(CASE WHEN pickup_status = 'substituted' THEN 1 ELSE 0 END) AS substituted_orders,
          round(sum(CASE WHEN pickup_status = 'missed' THEN 1 ELSE 0 END) / count(*), 4) AS miss_rate,
          cast(sum(lost_margin_eur) AS DECIMAL(14,2)) AS lost_margin_eur
FROM silver_pickup_orders
GROUP BY order_date, store_id, store_name, region, category;
