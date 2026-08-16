import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { renderArticleNotificationEmail, resolveLogoUrl } from './lib/emailTemplate';

interface SubscriberRow {
  email: string;
  unsubscribe_token: string;
  matched_via: 'author' | 'category' | 'all';
}

function firstOf<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Avisa a los suscriptores de un artículo recién publicado. La llama el
 * panel de administración una única vez, justo al pasar a "published" por
 * primera vez (ver ArticleEditPage.handleStatusChange) — pero esta función
 * vuelve a comprobarlo todo por su cuenta (estado real, `notified_at`)
 * antes de enviar nada, por si acaso.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.URL || 'https://pangloss.example';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Pangloss <onboarding@resend.dev>';

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return { statusCode: 500, body: 'Faltan variables de entorno (Supabase service role o Resend).' };
  }

  let body: { articleId?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'JSON inválido.' };
  }
  const articleId = body.articleId;
  if (!articleId) return { statusCode: 400, body: 'Falta articleId.' };

  // Cliente con la service role: ignora RLS a propósito — es el único
  // sitio de todo el proyecto donde eso es correcto, porque corre en
  // servidor y nunca se expone al navegador.
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select(
      'id, title, subtitle, slug, excerpt, featured_image_url, status, notified_at, category_id, author_id, category:categories(name), author:authors(name)',
    )
    .eq('id', articleId)
    .maybeSingle();

  if (articleError || !article) return { statusCode: 404, body: 'Artículo no encontrado.' };

  // Repite la comprobación que ya hace el cliente: solo se notifica una
  // vez, y solo si sigue publicado (por si se despublicó justo después de
  // pedir la notificación).
  if (article.status !== 'published' || article.notified_at) {
    return { statusCode: 200, body: 'Nada que hacer — ya notificado o no publicado.' };
  }

  const { data: subscribers, error: subsError } = await supabase.rpc('subscribers_for_article', {
    p_category_id: article.category_id,
    p_author_id: article.author_id,
  });

  if (subsError) return { statusCode: 500, body: 'No se pudo obtener la lista de suscriptores.' };

  const rows = (subscribers ?? []) as SubscriberRow[];
  const resend = new Resend(resendKey);
  const articleUrl = `${siteUrl}/articulo/${article.slug}`;
  const logoUrl = resolveLogoUrl(siteUrl);
  const categoryName = firstOf(article.category as { name: string } | { name: string }[] | null)?.name ?? null;
  const authorName = firstOf(article.author as { name: string } | { name: string }[] | null)?.name ?? null;

  const results = await Promise.allSettled(
    rows.map((sub) => {
      const { subject, html } = renderArticleNotificationEmail({
        logoUrl,
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        imageUrl: article.featured_image_url,
        articleUrl,
        unsubscribeUrl: `${siteUrl}/darse-de-baja?token=${sub.unsubscribe_token}`,
        preferencesUrl: `${siteUrl}/suscribete`,
        authorName,
        categoryName,
        matchedVia: sub.matched_via,
      });
      return resend.emails.send({ from: fromEmail, to: sub.email, subject, html });
    }),
  );

  // Se marca notificado tanto si hubo 0 suscriptores como si hubo fallos
  // parciales de envío — el aviso ya se ha "intentado" para este artículo,
  // y no se quiere reintentar en cada edición posterior.
  await supabase.from('articles').update({ notified_at: new Date().toISOString() }).eq('id', articleId);

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return { statusCode: 200, body: `Enviado a ${sent}/${rows.length} suscriptores.` };
};
