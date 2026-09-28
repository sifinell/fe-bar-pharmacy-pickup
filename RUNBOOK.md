# Runbook and resource map

All commands below target the explicitly selected Azure `DEFAULT` CLI profile. Keep it explicit on every Databricks CLI command. The build uses only synthetic data.

## Resources created

| Stage | Resource |
|---|---|
| Unity Catalog | `fe_bar_pharmacy_demo.pickup_operations` |
| Raw volume | `/Volumes/fe_bar_pharmacy_demo/pickup_operations/raw_sources/` |
| Lakeflow pipeline | `FE Bar Pharmacy Pickup Journey - neutral` (workspace-generated ID) |
| Lakebase project | `projects/fe-bar-pharmacy-pickup` |
| Lakebase UC catalog | `fe_bar_pharmacy_lb` |
| Synced table | `fe_bar_pharmacy_lb.ops.action_queue_demo` / Postgres `ops.action_queue_demo` |
| Genie space | Fictional Pharmacy Pickup Operations (supply its workspace ID) |
| SQL warehouse | Select an available serverless warehouse (supply its ID) |
| Databricks App | `fe-bar-pharmacy-pickup` |

## Rebuild sequence

1. Create a Python 3.12 virtual environment and install Databricks Connect 17.3 with the approved package registry. Do not commit `.venv`, local credentials, or a lockfile containing an internal proxy URL.
2. Run `DATABRICKS_CONFIG_PROFILE=DEFAULT .venv/bin/python src/generate_raw.py --catalog fe_bar_pharmacy_demo --schema pickup_operations`. It writes 25 stores, 400 products, 100,000 inventory snapshots, 120,000 pickup orders, and 20,000 deliveries.
3. `databricks bundle validate --strict -t neutral --profile DEFAULT`, then `databricks bundle deploy -t neutral --profile DEFAULT`, then `databricks bundle run pickup_journey -t neutral --profile DEFAULT`. If replacing raw files in place, trigger a **full refresh** of the Lakeflow pipeline; an incremental update will not automatically reinterpret overwritten source files.
4. Select a warehouse with `databricks warehouses list --profile DEFAULT`, then run `databricks experimental aitools tools query --warehouse <WAREHOUSE_ID> --param catalog=fe_bar_pharmacy_demo --param schema=pickup_operations --file src/enrich_actions.sql --profile DEFAULT`. This materializes five AI-generated recommendations and 120 deterministic monitoring notes into `ai_action_queue`. `ai_gen` has inference cost; do not run it on every app request.
5. The synced table is `TRIGGERED`, not continuous. Obtain its pipeline ID from `databricks postgres get-synced-table synced_tables/fe_bar_pharmacy_lb.ops.action_queue_demo --profile DEFAULT -o json`; start an update after re-enriching the source. Confirm `SYNCED_TABLE_ONLINE_NO_PENDING_UPDATE` and a recent commit version.
6. Use the Fictional Pharmacy Pickup Operations Genie space to query `gold_pickup_daily` and `ai_action_queue`. Verify answers against direct SQL and inspect generated SQL, as Genie can misstate business meaning even when its numeric query is correct.
7. In `app/fe-bar-pharmacy-pickup`, run `databricks apps validate --profile DEFAULT`. For bundle deployment, supply the workspace-specific `genie_space_id`, `postgres_branch`, and `postgres_database` variables using `--var` or `DATABRICKS_BUNDLE_VAR_*`; the checked-in bundle intentionally contains no workspace URL or resource IDs. The live app reads only `ops.action_queue_demo`; the project owner grants its service principal `USAGE` on `ops` and `SELECT` on `ops.action_queue_demo` in Postgres.

## Data contracts and decisions

- `silver_pickup_orders` validates IDs, quantity, and status; the bronze files are left intact for traceability.
- `gold_pickup_daily` is the governed analytical grain: day × store × category. Genie uses it for trend and cohort questions.
- `gold_action_queue` is the latest-day store/category decision grain. Its priority score is a transparent **heuristic**, not an ML prediction: `100 × miss_rate + 2 × low_stock_skus + 0.5 × avg_delay_hours`.
- `ai_action_queue` adds `ai_gen` advice only when score ≥100. The numerical evidence is preserved beside every recommendation. Action text is not a clinical instruction.
- Lakebase sync serves curated data at operational read latency; Unity Catalog remains the source of truth. Fine-grained Unity Catalog row filters and masks do **not** automatically transfer to Postgres. Use explicit Postgres grants and add row-level controls before multi-tenant use.
- `TRIGGERED` sync keeps cost lower for a demo but is not real time. The app shows source and enrichment timestamps so operators can see staleness.
- The AppKit Genie plugin is configured for on-behalf-of-user execution with `dashboards.genie` scope. The app's Lakebase read uses its service principal, which is explicitly granted read-only access to the synced table.

## FE Bar handoff

Execution evidence is in `evidence/` as text, not screenshots. Review and adapt `deck.md` and `ROLEPLAY.md` so the customer story, assumptions, and presentation are genuinely yours. This folder is not yet published to GitHub; a readable repository link and deck attachment are required by the FE Bar form. Do not publish any workspace credentials or real customer data.
