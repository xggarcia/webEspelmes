import { adminFetch as safeApiFetch } from '@/lib/api-admin';
import { CommandRunner } from '@/components/admin/CommandRunner';

type Listing = { commands: string[] };
type Run = {
  id: string;
  name: string;
  success: boolean;
  durationMs: number;
  affected: number;
  summary: string;
  dryRun: boolean;
  actorId: string | null;
  createdAt: string;
};

export default async function AdminCommandsPage() {
  const [listing, history] = await Promise.all([
    safeApiFetch<Listing>('/admin/commands'),
    safeApiFetch<Run[]>('/admin/commands/history?limit=50'),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Executar ordre</h2>
        <p className="text-sm text-ink/60">
          Validades amb Zod, autoritzades per rol i auditades automàticament. Pots fer{' '}
          <code className="rounded bg-ink/5 px-1 text-xs">dryRun: true</code> per a una
          previsualització sense escriure a la BD.
        </p>
        <CommandRunner commands={listing?.commands ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Historial</h2>
        <ul className="space-y-2">
          {(history ?? []).map((r) => (
            <li
              key={r.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                r.success ? 'border-ink/10 bg-cream' : 'border-ember/30 bg-ember/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ember">
                  {r.success ? '✓' : '✗'} {r.name}
                  {r.dryRun && <span className="ml-1 text-clay">(dry)</span>}
                </span>
                <span className="text-xs text-ink/50">
                  {new Date(r.createdAt).toLocaleString('ca-ES')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink/70">{r.summary}</p>
              <p className="text-[10px] text-ink/40">
                {r.affected} afectats · {r.durationMs} ms
              </p>
            </li>
          ))}
          {history && history.length === 0 && (
            <li className="text-sm text-ink/50">Encara no hi ha execucions registrades.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
