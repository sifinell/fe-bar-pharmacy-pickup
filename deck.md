# Slide 1 — Recover pickup availability where it matters most

Fictional regional pharmacy retailer · synthetic FE Bar prototype

In a five-day simulated disruption, North-region Cold & flu pickup orders missed at **50.82%** versus **2.13%** in Central and **1.94%** in South. The affected cohort carried **€93,587.68 of synthetic lost-margin exposure**.

If the operations team prevents **30%** of that exposure, the **modeled protection is ~€28.1k for an incident of this size**. This is a scenario assumption, not a realized customer saving.

Executive sponsor: protect margin and pickup trust. Regional operations owner: know which stores and assortments to act on first.

---

# Slide 2 — The operational problem

Pickup availability breaks when inventory signals, supplier delays, and order outcomes are reviewed in separate places. Teams discover misses after the customer has already arrived or cancelled.

Our controlled synthetic story: five North stores face a Cold & flu supplier delay. The source data contains linked orders, available-to-promise snapshots, and delivery events. The prototype identifies the hotspot, quantifies exposure, and provides a reviewable next action.

Buyer KPIs: missed-pickup rate, missed order count, lost-margin exposure, low-stock SKUs, supplier delay hours, and time to intervention.

---

# Slide 3 — Show the manager’s morning workflow

Open the Pickup Availability Command Center. The latest-day queue ranks store/category combinations by a transparent score built from missed-pickup rate, low-stock SKU count, and supplier delay.

The highest-priority row is Fictional Pharmacy 03 / Cold & flu: **375 missed pickups**, **80 low-stock SKUs**, **47.5-hour mean delay**, and a **240.0 priority score**. An AI-generated note proposes a stock transfer or supplier escalation, explicitly subject to human review.

What changes for the owner: one prioritized queue instead of reconciling three reports. The score guides triage; it does not autonomously change replenishment or give clinical advice.

---

# Slide 4 — Ask “why?” in plain language

Ask Genie: “Which region and product category had the highest missed pickup rate during 21–25 September 2026, and how much margin was lost?”

Executed answer: **North / Cold & flu, 50.82%, €93,587.68**. The app exposes the generated SQL and the signed-in user; Genie runs with user authorization against governed Unity Catalog tables.

Trust lesson from the actual run: Genie’s numbers and SQL were correct, but it called the highest failure rate “top-performing.” Users must verify interpretation, not just arithmetic.

---

# Slide 5 — One data journey, not six disconnected demos

Synthetic Parquet in a Unity Catalog volume → serverless Lakeflow bronze/silver/gold → governed daily metrics and action candidates → materialized AI-generated action notes → triggered Lakebase synced table → low-latency app queue.

Genie queries the same governed gold and enriched tables. The app does not write to the synced table. Every displayed action retains the source measures that explain its ranking.

Design trade-offs: triggered sync lowers demo cost but is not real time; Lakebase grants must be managed separately from Unity Catalog; AI text is advisory, and a human checks it before action.

---

# Slide 6 — Decision and pilot success criteria

Pilot with one region and a short list of pickup-critical categories. Agree on a baseline and holdout; measure whether earlier interventions reduce missed pickups and recovered margin, not merely whether recommendations look plausible.

Target hypothesis for this demo: prevent **30% of modeled lost-margin exposure** in a comparable five-day event (~€28.1k). Validate against actual customer economics, intervention costs, and supply constraints before claiming ROI.

Technical acceptance: data quality expectations pass; Unity Catalog and Postgres privileges are reviewed; Lakebase sync freshness is visible; Genie answers reconcile to SQL; AI actions remain human-approved. No real customer or patient data is in this prototype.

Speaker note: review these assumptions and rewrite the customer narrative in your own voice before FE Bar submission.
