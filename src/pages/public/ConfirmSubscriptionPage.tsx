import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmSubscription } from '@/lib/services/subscriptions';
import { usePageMeta } from '@/lib/seo';

type State = 'checking' | 'confirmed' | 'invalid';

export function ConfirmSubscriptionPage() {
  usePageMeta('Confirmar suscripción', undefined);
  const [params] = useSearchParams();
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('invalid');
      return;
    }
    confirmSubscription(token)
      .then((ok) => setState(ok ? 'confirmed' : 'invalid'))
      .catch(() => setState('invalid'));
  }, [params]);

  return (
    <div className="max-w-editorial mx-auto px-6 py-24 text-center">
      {state === 'checking' && <p className="text-base font-sans text-text-muted">Confirmando…</p>}

      {state === 'confirmed' && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">Confirmado.</h1>
          <p className="text-base font-sans text-text-secondary leading-relaxed mb-8">
            A partir de ahora te avisaremos por email cuando publiquemos algo nuevo.
          </p>
          <Link to="/" className="text-sm font-sans uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
            Ir a Pangloss →
          </Link>
        </>
      )}

      {state === 'invalid' && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">Este enlace ya no es válido.</h1>
          <p className="text-base font-sans text-text-secondary leading-relaxed mb-8">
            Puede que ya lo hayas confirmado antes, o que el enlace haya caducado.
          </p>
          <Link to="/suscribete" className="text-sm font-sans uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
            Suscribirme de nuevo →
          </Link>
        </>
      )}
    </div>
  );
}
