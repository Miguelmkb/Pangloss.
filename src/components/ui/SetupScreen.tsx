/** Se muestra solo en local mientras falta .env.local — nunca en producción. */
export function SetupScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-md">
        <img src="/logo.svg" alt="Pangloss" className="h-12 w-12 object-contain mb-6" />
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-3">
          Falta configurar Supabase
        </h1>
        <p className="text-sm font-sans text-text-secondary leading-relaxed mb-4">
          Crea un archivo <code className="font-mono text-xs bg-white border border-border px-1 py-0.5">.env.local</code> en
          la raíz del proyecto (a partir de <code className="font-mono text-xs bg-white border border-border px-1 py-0.5">.env.example</code>)
          con la URL y la clave anónima de tu proyecto de Supabase, y reinicia{' '}
          <code className="font-mono text-xs bg-white border border-border px-1 py-0.5">npm run dev</code>.
        </p>
        <p className="text-xs font-sans text-text-muted">
          Dashboard → Project Settings → API → Project URL / anon public key.
        </p>
      </div>
    </div>
  );
}
