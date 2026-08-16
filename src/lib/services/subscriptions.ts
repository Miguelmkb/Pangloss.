import { supabase } from '@/lib/supabase';

export interface SubscribeResult {
  id: string;
  confirm_token: string;
  needs_confirmation: boolean;
}

/**
 * Crea o actualiza una suscripción. Sin `categoryIds`/`authorIds` (ambos
 * vacíos) se suscribe a todo lo nuevo; con alguno, solo a esas categorías
 * o autores. Devuelve si hace falta enviar el email de confirmación —
 * quien llama es responsable de disparar ese envío (vía la función de
 * Netlify), esta llamada solo toca la base de datos.
 */
export async function subscribeToUpdates(
  email: string,
  categoryIds: string[] = [],
  authorIds: string[] = [],
): Promise<SubscribeResult> {
  const { data, error } = await supabase
    .rpc('subscribe', { p_email: email, p_category_ids: categoryIds, p_author_ids: authorIds })
    .single();
  if (error) throw error;
  return data as unknown as SubscribeResult;
}

export async function confirmSubscription(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('confirm_subscription', { p_token: token });
  if (error) throw error;
  return Boolean(data);
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('unsubscribe', { p_token: token });
  if (error) throw error;
  return Boolean(data);
}

/**
 * Dispara el envío del email de confirmación vía la función de Netlify —
 * el envío real (con la clave de Resend) solo puede vivir en servidor,
 * nunca en el navegador. No lanza si la función aún no existe en este
 * entorno (p. ej. en local sin `netlify dev`): la suscripción ya quedó
 * guardada en la base de datos, que es lo importante; el email es best
 * effort desde aquí.
 */
export async function triggerConfirmationEmail(email: string, confirmToken: string): Promise<void> {
  try {
    await fetch('/.netlify/functions/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmToken }),
    });
  } catch {
    /* no crítico desde el punto de vista del cliente: ver comentario de la función */
  }
}

/**
 * Avisa a los suscriptores de que un artículo se acaba de publicar por
 * primera vez. Quien llama (ArticleEditPage) ya comprueba que es la
 * primera vez antes de invocar esto — y la propia función de Netlify lo
 * vuelve a comprobar por su cuenta contra `notified_at`, así que llamarla
 * de más nunca duplica envíos.
 */
export async function triggerArticleNotification(articleId: string): Promise<void> {
  try {
    await fetch('/.netlify/functions/notify-subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    });
  } catch {
    /* best effort desde el cliente — no crítico, ver comentario arriba */
  }
}
