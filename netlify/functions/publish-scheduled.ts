import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Se ejecuta periódicamente (cron declarado en netlify.toml) y dice
 * "publicado" de verdad a cualquier artículo "scheduled" cuya fecha ya
 * haya llegado.
 *
 * Importante: esto NO es lo que decide si un lector puede verlo — eso ya
 * lo hace, con fiabilidad total y sin depender de que este cron se
 * ejecute a tiempo, el propio filtro de visibilidad aplicado en cada
 * lectura (`article_is_live()` en RLS, `visibleNow()` en las consultas
 * públicas): un "scheduled" cuya fecha ya pasó ya es públicamente visible
 * aunque este cron todavía no haya pasado por él. Lo que SÍ depende de
 * este cron es (1) que el panel dadmin deje de mostrarlo como
 * "Programado" y pase a "Publicado" de verdad, y (2) el aviso a
 * suscriptores — un efecto real de una sola vez que no puede quedar en
 * manos de una simple lectura.
 *
 * Deliberadamente NO manda `published_at` en el UPDATE: al no venir en la
 * petición, Postgres conserva sola la fecha que ya tenía la fila (la
 * programada), y el trigger `tg_articles_freeze_published_at` la respeta
 * tal cual — así la fecha que ve el lector sigue siendo la programada
 * originalmente, no el instante en que este cron pasó a comprobarlo.
 */
export const handler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.URL || 'https://pangloss.example';
  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: 'Faltan variables de entorno (Supabase service role).' };
  }

  // Service role: corre en servidor, sin RLS, a propósito — necesita ver
  // y cambiar artículos "scheduled" de cualquier autor.
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: due, error } = await supabase.from('articles').select('id').eq('status', 'scheduled').lte('published_at', new Date().toISOString());

  if (error) return { statusCode: 500, body: 'No se pudo consultar los artículos programados.' };

  const rows = due ?? [];
  for (const row of rows) {
    const { error: updateError } = await supabase.from('articles').update({ status: 'published' }).eq('id', row.id);
    if (updateError) continue;
    try {
      await fetch(`${siteUrl}/.netlify/functions/notify-subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: row.id }),
      });
    } catch {
      /* best effort, mismo criterio que triggerArticleNotification en el cliente */
    }
  }

  return { statusCode: 200, body: `Publicados ${rows.length} artículo(s) programado(s).` };
};
