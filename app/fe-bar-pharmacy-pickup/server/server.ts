import { createApp, genie, lakebase, server } from '@databricks/appkit';

const genieSpaceId = process.env.DATABRICKS_GENIE_SPACE_ID;
if (!genieSpaceId) throw new Error('DATABRICKS_GENIE_SPACE_ID is required');

createApp({
  plugins: [
    genie({ spaces: { default: genieSpaceId } }),
    lakebase(),
    server(),
  ],
  async onPluginsReady(appkit) {
    appkit.server.extend((app) => {
      app.get('/api/whoami', (req, res) => {
        res.json({
          email: req.header('x-forwarded-email') ?? null,
          user: req.header('x-forwarded-user') ?? null,
        });
      });

      app.get('/api/actions', async (_req, res) => {
        try {
          const { rows } = await appkit.lakebase.query(`
            SELECT action_id, as_of_date, store_id, store_name, region, category,
                   order_count, missed_orders, substituted_orders, miss_rate,
                   lost_margin_eur, low_stock_skus, avg_delay_hours, priority_score,
                   suggested_action, action_disclaimer, enriched_at
            FROM ops.action_queue_demo
            ORDER BY priority_score DESC, action_id
            LIMIT 150
          `);
          res.json(rows);
        } catch (error) {
          console.error('Unable to read synced action queue', error);
          res.status(503).json({ error: 'The operational action queue is unavailable. Check Lakebase sync and app grants.' });
        }
      });
    });
  },
}).catch(console.error);
