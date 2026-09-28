# Execution evidence — 25 September 2026 UTC

These are observed outputs from the neutral, wholly synthetic build in `fe_bar_pharmacy_demo.pickup_operations`. CLI profile: `DEFAULT` (Azure). No customer records are used.

## Raw generation and Lakeflow

The generator wrote Parquet under `/Volumes/fe_bar_pharmacy_demo/pickup_operations/raw_sources/`. Observed row counts:

```text
stores          25
products       400
inventory   100000
pickup_orders 120000
deliveries    20000
```

The neutral Lakeflow pipeline update reached `COMPLETED`. The five bronze inputs, validated silver orders, and gold materialized views ran in the neutral schema. Silver quality expectations `valid_order`, `valid_quantity`, and `valid_status` each reported 120,000 passed records and zero failed records.

## Governed analytical results

The ten-day order population has 120,000 orders, 10,514 missed pickups, and €115,306.40 of modeled lost margin. For the five-day North / Cold & flu incident cohort (21–25 September 2026), `gold_pickup_daily` returned:

```text
orders   missed   missed_rate   modeled_lost_margin_eur
16775    8525     50.82%        93587.68
```

`ai_action_queue` has 125 store/category rows, five of them with AI-generated urgent recommendations. The recommendations are advisory; priority scores are transparent heuristics, not a trained predictive model.

## Lakebase operational copy

The dedicated Lakebase project is `projects/fe-bar-pharmacy-pickup`. The triggered synced table `synced_tables/fe_bar_pharmacy_lb.ops.action_queue_demo` reported `SYNCED_TABLE_ONLINE_NO_PENDING_UPDATE`; its latest observed sync ended at `2026-09-25T15:01:44.472652Z` from Delta commit version `0`. Direct Postgres SQL on `ops.action_queue_demo` returned:

```text
action_rows | urgent_rows
125         | 5
```

## Genie analysis

The Fictional Pharmacy Pickup Operations Genie space was updated to the neutral governed tables. A new conversation completed against `fe_bar_pharmacy_demo.pickup_operations.gold_pickup_daily` and returned a 50.82% missed-pickup rate and €93,587.68 modeled lost margin for North / Cold & flu. Genie described the highest failure rate as “top-performing.” The SQL and numbers matched the governed result, but that interpretation was wrong; the app therefore exposes generated SQL and a verification warning.

## Validation

The AppKit app passed `databricks apps validate --profile DEFAULT`, including type generation, lint, type checking, build, and tests. The deployed route results are recorded separately in `02-live-app.md`.
