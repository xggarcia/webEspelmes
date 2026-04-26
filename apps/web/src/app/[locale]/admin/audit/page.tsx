import { adminFetch as safeApiFetch } from '@/lib/api-admin';

type AuditEntry = {
  id: string;
  action: string;
  actorId: string | null;
  target: string | null;
  ip: string | null;
  metadata: unknown;
  createdAt: string;
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actorId?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams({ limit: '150' });
  if (sp.action) qs.set('action', sp.action);
  if (sp.actorId) qs.set('actorId', sp.actorId);

  const entries = await safeApiFetch<AuditEntry[]>(`/admin/audit?${qs.toString()}`, {
    forwardCookies: true,
  });
  if (!entries) return <p className="text-ember">Error carregant auditoria.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Auditoria ({entries.length})</h2>
        <form className="flex gap-2 text-sm">
          <input
            name="action"
            defaultValue={sp.action ?? ''}
            placeholder="Filtrar acció"
            className="rounded-md border border-ink/15 bg-cream px-2 py-1"
          />
          <button type="submit" className="rounded-md bg-ink px-3 py-1 text-cream">
            Filtrar
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-cream">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-wax/40 text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-3 py-2">Acció</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Objectiu</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Detalls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-3 py-2 font-mono text-xs text-ember">{e.action}</td>
                <td className="px-3 py-2 font-mono text-xs text-ink/70">
                  {e.actorId?.slice(0, 8) ?? '—'}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-ink/70">
                  {e.target?.slice(0, 12) ?? '—'}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-ink/50">{e.ip ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-ink/70">
                  {new Date(e.createdAt).toLocaleString('ca-ES')}
                </td>
                <td className="px-3 py-2">
                  {e.metadata != null && (
                    <details>
                      <summary className="cursor-pointer text-xs text-ink/50">Veure</summary>
                      <pre className="mt-1 max-w-md overflow-auto rounded bg-ink/5 p-2 text-[10px] text-ink/70">
                        {JSON.stringify(e.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
