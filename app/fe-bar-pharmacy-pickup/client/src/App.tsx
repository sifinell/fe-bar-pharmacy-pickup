import { useEffect, useMemo, useState } from 'react';
import {
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton,
} from '@databricks/appkit-ui/react';
import { GeniePage } from './pages/genie/GeniePage';

type Action = {
  action_id: string;
  as_of_date: string;
  store_name: string;
  region: string;
  category: string;
  order_count: number | string;
  missed_orders: number | string;
  miss_rate: number | string;
  lost_margin_eur: number | string;
  low_stock_skus: number | string;
  avg_delay_hours: number | string;
  priority_score: number | string;
  suggested_action: string;
  action_disclaimer: string;
  enriched_at: string;
};

const eur = (value: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
}).format(value);

function Kpi({ title, value, note }: { title: string; value: string; note: string }) {
  return <Card><CardHeader><CardDescription>{title}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{note}</CardContent></Card>;
}

function ActionQueue() {
  const [rows, setRows] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/actions')
      .then(async response => {
        if (!response.ok) {
          const body = await response.json() as { error?: string };
          throw new Error(body.error ?? `HTTP ${response.status}`);
        }
        return response.json() as Promise<Action[]>;
      })
      .then(setRows)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load actions'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    missed: rows.reduce((sum, row) => sum + Number(row.missed_orders), 0),
    margin: rows.reduce((sum, row) => sum + Number(row.lost_margin_eur), 0),
    urgent: rows.filter(row => Number(row.priority_score) >= 100).length,
  }), [rows]);
  const visible = showAll ? rows : rows.slice(0, 12);
  const asOf = rows[0]?.as_of_date?.slice(0, 10) ?? '—';

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Synthetic prototype</Badge><Badge variant="outline">Lakebase synced serving</Badge></div>
      <h2 className="text-3xl font-semibold tracking-tight">Prioritize pickup recovery today</h2>
      <p className="text-muted-foreground">A store-level action queue for a fictional pharmacy retailer. Every recommendation links to missed orders, stock position, and supplier delay signals.</p>
    </div>
    {loading && <div className="grid gap-4 md:grid-cols-3" aria-label="Loading action queue">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>}
    {error && <Card className="border-destructive"><CardHeader><CardTitle>Action queue unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card>}
    {!loading && !error && rows.length === 0 && <Card><CardHeader><CardTitle>No actions found</CardTitle><CardDescription>Check the source table and the latest Lakebase sync run.</CardDescription></CardHeader></Card>}
    {!loading && !error && rows.length > 0 && <>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi title="Missed pickups" value={stats.missed.toLocaleString()} note={`Latest day · ${asOf} · Lakebase/UC source`} />
        <Kpi title="Lost margin exposure" value={eur(stats.margin)} note={`Synthetic EUR · ${asOf} · not recovered revenue`} />
        <Kpi title="Urgent store-category actions" value={String(stats.urgent)} note={`Priority score ≥100 · ${asOf} · review required`} />
      </div>
      <Card>
        <CardHeader><CardTitle>Store/category intervention queue</CardTitle><CardDescription>Sorted by transparent priority score: missed-order rate, low-stock SKUs, and mean supplier delay. Recommendations are advisory.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="border-b text-muted-foreground"><tr><th className="p-2">Store / category</th><th className="p-2">Priority</th><th className="p-2">Missed / orders</th><th className="p-2">Low-stock SKUs</th><th className="p-2">Delay</th><th className="p-2">Lost margin</th></tr></thead><tbody>{visible.map(row => <tr key={row.action_id} className="border-b align-top"><td className="p-2 font-medium">{row.store_name}<div className="text-xs font-normal text-muted-foreground">{row.region} · {row.category}</div></td><td className="p-2"><Badge variant={Number(row.priority_score) >= 100 ? 'destructive' : 'secondary'}>{Number(row.priority_score).toFixed(1)}</Badge></td><td className="p-2">{Number(row.missed_orders).toLocaleString()} / {Number(row.order_count).toLocaleString()}<div className="text-xs text-muted-foreground">{(Number(row.miss_rate) * 100).toFixed(1)}% miss rate</div></td><td className="p-2">{Number(row.low_stock_skus)}</td><td className="p-2">{Number(row.avg_delay_hours).toFixed(1)} h</td><td className="p-2">{eur(Number(row.lost_margin_eur))}</td></tr>)}</tbody></table></div>
          {rows.length > 12 && <Button variant="outline" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show top 12' : `Show all ${rows.length}`}</Button>}
        </CardContent>
      </Card>
      {rows[0] && <Card><CardHeader><CardTitle>Recommended next move: {rows[0].store_name}</CardTitle><CardDescription>{rows[0].category} · score {Number(rows[0].priority_score).toFixed(1)} · refreshed {rows[0].enriched_at?.slice(0, 16).replace('T', ' ')} UTC</CardDescription></CardHeader><CardContent><p>{rows[0].suggested_action}</p><p className="mt-3 text-xs text-muted-foreground">{rows[0].action_disclaimer}</p></CardContent></Card>}
    </>}
  </div>;
}

export default function App() {
  const [tab, setTab] = useState<'actions' | 'genie'>('actions');
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b px-4 py-4 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Pickup Availability Command Center</p><p className="text-xs text-muted-foreground">Fictional pharmacy operations · FE Bar prototype</p></div><nav className="flex gap-2"><Button variant={tab === 'actions' ? 'default' : 'outline'} onClick={() => setTab('actions')}>Action queue</Button><Button variant={tab === 'genie' ? 'default' : 'outline'} onClick={() => setTab('genie')}>Ask Genie</Button></nav></div></header>
    <main className="p-4 md:p-8">{tab === 'actions' ? <ActionQueue /> : <GeniePage />}</main>
  </div>;
}
