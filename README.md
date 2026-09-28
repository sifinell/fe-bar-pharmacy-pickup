# Pickup availability for a fictional pharmacy retailer

This FE Bar prototype addresses missed pharmacy pickup orders caused by a regional supplier disruption. All stores, products, events, and economics are synthetic. Nothing here represents a real customer.

In the simulated five-day disruption, North / Cold & flu missed 50.82% of pickup orders, exposing €93,587.68 of modeled margin. At an explicitly assumed 30% prevention rate, a comparable incident would protect about €28.1k; this is a scenario estimate, not measured savings.

The business decision is: **which store/category combinations should a regional operations manager act on today to prevent the most pickup misses and margin leakage?**

## Integrated journey

1. `src/generate_raw.py` creates linked synthetic stores, products, inventory snapshots, pickup orders, and delivery events as Parquet in a governed Unity Catalog volume.
2. A serverless Lakeflow Declarative Pipeline ingests the files, validates orders, and publishes pickup-performance and stockout-action materialized views.
3. Unity Catalog governs the volume and all pipeline outputs in `fe_bar_pharmacy_demo.pickup_operations`.
4. A Databricks AI Function writes a short action note for each prioritized risk row into a Delta table. Recommendations are advisory, and the source features stay visible.
5. A triggered Lakebase synced table copies the enriched action queue to PostgreSQL for fast operational lookups. The app never writes to the synced table.
6. A Genie space answers natural-language questions on the governed pickup-performance and action tables.
7. A separate Databricks App gives store managers the prioritized queue plus a Genie question surface.

## Run order

See `RUNBOOK.md`. Live output and resource identifiers are recorded under `evidence/` only after execution; code and a screenshot alone are not execution evidence.

## Presentation

Open [`index.html`](index.html) in a browser for the seven-slide, self-contained presentation. Use the arrow keys or the on-screen controls; choose **PDF** (or press **P**) to print every slide to a PDF for the FE Bar deck attachment. `deck.md` is the text-readable source and fallback attachment. All figures are synthetic or explicitly modeled.

## Integrity and limitations

The dataset, disruption, prices, margins, and any value estimate are synthetic assumptions. The action notes are AI-generated and must be reviewed by a human. This is a prototype, not a replenishment system or a clinical recommendation. The FE submitting it must review the choices, adapt the customer narrative, and attest to their own work. No publication or FE Bar submission is performed by this project.
