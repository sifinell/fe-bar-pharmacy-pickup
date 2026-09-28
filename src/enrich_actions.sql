-- Run once after a successful Lakeflow refresh. AI inference is materialized,
-- never re-run on every app or Genie query.
CREATE OR REPLACE TABLE IDENTIFIER(:catalog || '.' || :schema || '.ai_action_queue')
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')
COMMENT 'Governed action queue with AI-generated, human-reviewable operational advice'
AS
SELECT action_id, as_of_date, store_id, store_name, region, category,
       order_count, missed_orders, substituted_orders, miss_rate,
       lost_margin_eur, tracked_skus, low_stock_skus, avg_delay_hours,
       priority_score,
       CASE WHEN priority_score >= 100 THEN
         ai_gen(concat(
           'You advise a fictional pharmacy pickup operations manager. ',
           'Write one concise, non-clinical operational action sentence. ',
           'Do not invent quantities, dates, suppliers, or causes. ',
           'Store: ', store_name, '; category: ', category,
           '; missed pickup orders today: ', cast(missed_orders AS STRING),
           '; low-stock SKUs: ', cast(low_stock_skus AS STRING),
           '; mean supplier delay hours: ', cast(avg_delay_hours AS STRING),
           '. Suggest a stock transfer or supplier escalation and human review.'
         ))
       ELSE 'Monitor availability; no urgent intervention indicated by the current priority score.' END
         AS suggested_action,
       CASE WHEN priority_score >= 100
         THEN 'AI-generated advisory; verify against source metrics and store policy.'
         ELSE 'Rule-based monitoring note; verify against source metrics and store policy.'
       END AS action_disclaimer,
       current_timestamp() AS enriched_at
FROM IDENTIFIER(:catalog || '.' || :schema || '.gold_action_queue');
