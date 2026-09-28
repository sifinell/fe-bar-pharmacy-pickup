CREATE OR REFRESH STREAMING TABLE silver_pickup_orders (
  CONSTRAINT valid_order EXPECT (order_id IS NOT NULL AND store_id IS NOT NULL AND product_id IS NOT NULL) ON VIOLATION DROP ROW,
  CONSTRAINT valid_quantity EXPECT (quantity > 0) ON VIOLATION DROP ROW,
  CONSTRAINT valid_status EXPECT (pickup_status IN ('ready', 'substituted', 'missed')) ON VIOLATION DROP ROW
)
COMMENT 'Validated pickup orders enriched with governed store and product dimensions'
AS SELECT o.order_id, o.order_date, o.store_id, s.store_name, s.region,
          o.product_id, p.product_name, p.category, o.quantity,
          o.pickup_status, o.available_units, o.unit_price_eur,
          o.unit_margin_eur, o.lost_margin_eur
FROM STREAM bronze_pickup_orders o
LEFT JOIN bronze_stores s ON o.store_id = s.store_id
LEFT JOIN bronze_products p ON o.product_id = p.product_id;
