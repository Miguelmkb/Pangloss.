import { useState } from 'react';
import { subscribeToUpdates, triggerConfirmationEmail } from '@/lib/services/subscriptions';

export type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Lógica compartida por el formulario rápido del footer y el de
 * preferencias en /suscribete: guarda la suscripción y, si hace falta,
 * dispara el email de confirmación — nunca envía nada si la persona ya
 * estaba confirmada (p. ej. solo está cambiando sus preferencias).
 */
export function useSubscribe() {
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(email: string, categoryIds: string[] = [], authorIds: string[] = []) {
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await subscribeToUpdates(trimmed, categoryIds, authorIds);
      if (result.needs_confirmation) {
        await triggerConfirmationEmail(trimmed, result.confirm_token);
      }
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo completar la suscripción.');
      setStatus('error');
    }
  }

  return { status, errorMessage, submit };
}
