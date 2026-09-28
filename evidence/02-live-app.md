# Live app evidence — 25 September 2026 UTC

App: `fe-bar-pharmacy-pickup`
Workspace-specific app URL omitted from the public evidence; the live app was tested through its authenticated routes.
The pre-existing memory demo app was not changed.

`databricks apps get fe-bar-pharmacy-pickup --profile DEFAULT -o json` returned `app_status.state=RUNNING` and `active_deployment.status.state=SUCCEEDED` after deployment of the neutral source.

## Operational action queue

The app identity was granted Postgres `USAGE` on schema `ops` and `SELECT` on the neutral synced table `ops.action_queue_demo`. A direct privilege check for that identity returned:

```text
schema_usage | can_select | can_insert
t            | t          | f
```

Direct Postgres SQL returned 125 action rows, including five urgent rows. Authenticated GET `/api/actions` from the deployed app returned:

```json
{
  "rows": 125,
  "first": {
    "action_id": "2-cold_flu",
    "priority_score": 240,
    "missed_orders": "375",
    "low_stock_skus": "80",
    "enriched_at": "2026-09-25T15:00:31.061Z"
  }
}
```

The enrichment timestamp distinguishes this neutral sync from the earlier development run. Authenticated GET `/api/whoami` returned the signed-in user; the identifier and bearer token are not recorded here.

## Governed natural-language query

Authenticated POST `/api/genie/default/messages` asked: “How many missed pickup orders were there on 25 September 2026?” The SSE stream reached `COMPLETED`, returned the following generated SQL, and then returned an executed result of `1822`:

```sql
SELECT COALESCE(SUM(`missed_orders`), 0) AS `missed_pickup_orders`
FROM `fe_bar_pharmacy_demo`.`pickup_operations`.`gold_pickup_daily`
WHERE `order_date` = DATE '2026-09-25'
```

An independent warehouse query of the same neutral gold table also returned `1822`. This verifies that the deployed app's Genie route uses the governed neutral catalog, while its operational queue reads the Lakebase copy.
