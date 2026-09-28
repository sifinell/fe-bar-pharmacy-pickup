import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, GenieChatMessage, Input, Skeleton, useGenieChat } from '@databricks/appkit-ui/react';

export function GeniePage() {
  const { messages, status, sendMessage, reset, error } = useGenieChat({ alias: 'default', urlParamName: 'neutralConversationId' });
  const [question, setQuestion] = useState('');
  const [me, setMe] = useState<{ email?: string | null; user?: string | null } | null>(null);
  useEffect(() => { fetch('/api/whoami').then(response => response.ok ? response.json() : null).then(setMe).catch(() => {}); }, []);
  const lastSql = useMemo(() => {
    for (const message of [...messages].reverse()) {
      for (const attachment of message.attachments ?? []) if (attachment.query?.query) return attachment.query;
    }
    return null;
  }, [messages]);

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-3xl font-semibold">Ask pickup operations</h2><p className="text-muted-foreground">Genie queries the governed Unity Catalog performance and action tables.</p></div><Badge variant="secondary">{me?.email ?? 'Signed-in user'}</Badge></div>
    <Card><CardHeader><CardTitle>Natural-language investigation</CardTitle><CardDescription>Queries run on your behalf with Databricks Genie user authorization. Your Unity Catalog permissions apply. AI answers may be wrong; inspect the SQL.</CardDescription></CardHeader><CardContent className="space-y-4">
      <form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (question.trim()) { sendMessage(question.trim()); setQuestion(''); } }}><Input aria-label="Ask a data question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Which region had the most missed pickups last week?" disabled={status === 'streaming'} /><Button type="submit" disabled={!question.trim() || status === 'streaming'}>Ask</Button></form>
      {messages.length === 0 && status !== 'loading-history' && <div className="rounded-md border p-5 text-sm text-muted-foreground">Try: “Which region and category had the highest missed pickup rate during 21–25 September 2026?”</div>}
      {status === 'loading-history' && <Skeleton className="h-20 w-full" />}
      <div className="max-h-[440px] space-y-4 overflow-auto" aria-live="polite">{messages.map(message => <div key={message.id}><GenieChatMessage message={message} />{message.role === 'assistant' && <p className="mt-1 text-xs text-muted-foreground">AI-generated from governed data; verify the generated SQL and source metrics.</p>}</div>)}</div>
      {status === 'streaming' && <p className="text-sm text-muted-foreground">Genie is analyzing your data…</p>}
      {status === 'error' && <p className="text-sm text-destructive" role="alert">{error ?? 'Genie failed. Rephrase or retry.'}</p>}
      <Button variant="outline" onClick={reset}>New conversation</Button>
    </CardContent></Card>
    {lastSql && <Card><CardHeader><CardTitle>Generated SQL</CardTitle><CardDescription>{lastSql.title ?? 'How the latest answer was computed'}</CardDescription></CardHeader><CardContent><pre className="overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{lastSql.query}</pre></CardContent></Card>}
  </div>;
}
