import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { unsubscribeByToken } from '@/lib/services/subscriptions';
import { usePageMeta } from '@/lib/seo';

type State = 'checking' | 'done' | 'invalid';

export function UnsubscribePage() {
  usePageMeta('Darse de baja', undefined);
  const [params] = useSearchParams();
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('invalid');
      return;
    }
    unsubscribeByToken(token)
      .then((ok) => setState(ok ? 'done' : 'invalid'))
      .catch(() => setState('invalid'));
  }, [params]);

  return (
    <div className="max-w-editorial mx-auto px-6 py-24 text-center">
      {state === 'checking' && <p className="text-base font-sans text-text-muted">Procesando…</p>}

      {state === 'done' && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">Hecho.</h1>
          <p className="text-base font-sans text-text-secondary leading-relaxed mb-8">
            No volverás a recibir avisos por email. Si cambias de opinión, siempre puedes suscribirte otra vez.
          </p>
          <Link to="/" className="text-sm font-sans uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
            Ir a Pangloss →
          </Link>
        </>
      )}

      {state === 'invalid' && (
        <p className="text-base font-sans text-text-secondary leading-relaxed">Este enlace ya no es válido.</p>
      )}
    </div>
  );
}
