CREATE OR REFRESH MATERIALIZED VIEW gold_action_queue
COMMENT 'Latest-day store/category intervention candidates with traceable risk features'
AS
WITH latest AS (SELECT max(order_date) AS as_of_date FROM gold_pickup_daily),
orders AS (
  SELECT d.* FROM gold_pickup_daily d CROSS JOIN latest l WHERE d.order_date = l.as_of_date
),
inventory AS (
  SELECT i.store_id, p.category,
         count(*) AS tracked_skus,
         sum(CASE WHEN i.available_units <= 3 THEN 1 ELSE 0 END) AS low_stock_skus
  FROM bronze_inventory i
  JOIN bronze_products p ON i.product_id = p.product_id
  CROSS JOIN latest l
  WHERE i.snapshot_date = l.as_of_date
  GROUP BY i.store_id, p.category
),
deliveries AS (
  SELECT d.store_id, p.category, round(avg(d.delay_hours), 1) AS avg_delay_hours
  FROM bronze_deliveries d
  JOIN bronze_products p ON d.product_id = p.product_id
  CROSS JOIN latest l
  WHERE d.delivery_date BETWEEN date_sub(l.as_of_date, 4) AND l.as_of_date
  GROUP BY d.store_id, p.category
)
SELECT concat(cast(o.store_id AS STRING), '-', regexp_replace(lower(o.category), '[^a-z0-9]+', '_')) AS action_id,
       o.order_date AS as_of_date, o.store_id, o.store_name, o.region, o.category,
       o.order_count, o.missed_orders, o.substituted_orders, o.miss_rate, o.lost_margin_eur,
       coalesce(i.tracked_skus, 0) AS tracked_skus,
       coalesce(i.low_stock_skus, 0) AS low_stock_skus,
       coalesce(d.avg_delay_hours, 0.0) AS avg_delay_hours,
       round(100.0 * o.miss_rate + 2.0 * coalesce(i.low_stock_skus, 0) + 0.5 * coalesce(d.avg_delay_hours, 0.0), 1) AS priority_score
FROM orders o
LEFT JOIN inventory i ON o.store_id = i.store_id AND o.category = i.category
LEFT JOIN deliveries d ON o.store_id = d.store_id AND o.category = d.category;
