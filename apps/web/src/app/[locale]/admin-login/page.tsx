import { adminLogin } from './actions';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;

  const action = adminLogin.bind(null, locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-3">Accés restringit</p>
          <h1 className="font-display text-5xl text-ink">Administracio</h1>
          <p className="mt-3 text-ink/55">Enganxa el token d&apos;acces per continuar.</p>
        </div>

        <form action={action} className="space-y-4">
          <textarea
            name="token"
            required
            rows={5}
            placeholder="Enganxa aqui el token..."
            className="w-full rounded-2xl border border-ink/15 bg-white px-5 py-4 font-mono text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-ember focus:ring-2 focus:ring-ember/15"
            autoFocus
          />

          {error && (
            <p className="text-center text-sm text-ember">
              Token incorrecte. Torna-ho a provar.
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
