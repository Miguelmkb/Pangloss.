import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmSubscription } from '@/lib/services/subscriptions';
import { usePageMeta } from '@/lib/seo';
import { useSiteContent } from '@/context/SiteContentContext';

type State = 'checking' | 'confirmed' | 'invalid';

export function ConfirmSubscriptionPage() {
  usePageMeta('Confirmar suscripción', undefined);
  const [params] = useSearchParams();
  const [state, setState] = useState<State>('checking');

  const confirmedTitle = useSiteContent('subscribeConfirm.confirmedTitle');
  const confirmedBody = useSiteContent('subscribeConfirm.confirmedBody');
  const backToPangloss = useSiteContent('common.backToPangloss');
  const invalidTitle = useSiteContent('subscribeConfirm.invalidTitle');
  const invalidBody = useSiteContent('subscribeConfirm.invalidBody');
  const invalidLink = useSiteContent('subscribeConfirm.invalidLink');

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
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">{confirmedTitle}</h1>
          <p className="text-base font-sans text-text-secondary leading-relaxed mb-8">{confirmedBody}</p>
          <Link to="/" className="text-sm font-sans uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
            {backToPangloss}
          </Link>
        </>
      )}

      {state === 'invalid' && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-text-primary mb-4">{invalidTitle}</h1>
          <p className="text-base font-sans text-text-secondary leading-relaxed mb-8">{invalidBody}</p>
          <Link to="/suscribete" className="text-sm font-sans uppercase tracking-widest text-accent hover:text-accent-hover transition-colors">
            {invalidLink}
          </Link>
        </>
      )}
    </div>
  );
}
