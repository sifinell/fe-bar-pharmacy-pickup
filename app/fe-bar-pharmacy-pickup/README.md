# Pickup availability Databricks App

This AppKit/React app serves the synthetic store/category action queue from the dedicated Lakebase synced table `ops.action_queue_demo`. Its Genie pane asks questions of the governed Unity Catalog tables. The app never writes to the synced table.

The app's `databricks.yml` deliberately has no workspace host or resource IDs. Supply `genie_space_id`, `postgres_branch`, and `postgres_database` when validating or deploying the bundle with your chosen CLI profile. The root [runbook](../../RUNBOOK.md) describes the full build and access grants.

For local development, copy `.env.example` to `.env` and fill in your own workspace and Lakebase connection settings. `.env` is ignored by Git. Node.js 22+ is required. Run `npm ci`, then `npm run dev`; use `databricks apps validate --profile <PROFILE>` for source validation.

The UI labels AI advice as advisory, shows the underlying source metrics, and exposes Genie-generated SQL for human review. No patient information or real customer data is included.
