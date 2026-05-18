import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listRefreshTokens, revokeRefreshToken } from '@/lib/api';

export function RefreshTokensPanel({ onClose }: { onClose: () => void }) {
  const [tokens, setTokens] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [total, setTotal] = useState<number | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);

  const fetchTokens = async (p = 0) => {
    setLoading(true);
    try {
      const res = await listRefreshTokens(pageSize, p * pageSize);
      setTokens(res?.tokens || []);
      setTotal(res?.total ?? null);
    } catch (e) {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTokens(page);
  }, [page]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeRefreshToken(id);
      setTokens((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
      setPendingRevoke(null);
    } catch (e) {
      // ignore
      setPendingRevoke(null);
    }
  };

  return (
    <Card className="w-[28rem]">
      <CardHeader>
        <CardTitle>Refresh Tokens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : tokens && tokens.length ? (
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
                <div className="text-sm">
                  <div className="truncate font-mono text-xs text-muted-foreground">{t.id}</div>
                  <div className="text-[13px] text-foreground">{t.user_id ?? 'unknown'}</div>
                </div>
                  <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">{t.revoked ? 'revoked' : t.expires_at ?? ''}</div>
                  <Button size="sm" variant="outline" onClick={() => setPendingRevoke(t.id)}>Revoke</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No tokens found.</div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
            <div className="text-sm text-muted-foreground">Page {page + 1}{total ? ` of ${Math.ceil(total / pageSize)}` : ''}</div>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={total !== null ? (page + 1) * pageSize >= (total ?? 0) : (!tokens || tokens.length < pageSize)}>Next</Button>
          </div>
          <div>
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
        {pendingRevoke ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[28rem] rounded-2xl bg-card p-6">
              <h3 className="text-lg font-semibold">Confirm revoke</h3>
              <p className="mt-2 text-sm text-muted-foreground">Revoke token <span className="font-mono text-xs">{pendingRevoke}</span>? This cannot be undone.</p>
                <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setPendingRevoke(null)}>Cancel</Button>
                <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={() => void handleRevoke(pendingRevoke)}>Revoke</Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default RefreshTokensPanel;
