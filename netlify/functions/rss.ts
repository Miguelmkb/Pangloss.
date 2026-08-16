import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Feed RSS generado en caliente (no un archivo estático) para que siempre
 * refleje los artículos publicados más recientes sin depender de un nuevo
 * build. Reutiliza las mismas variables de entorno que el cliente
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — deben estar configuradas
 * también como variables de entorno del sitio en Netlify, no solo en
 * .env.local.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const handler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: 'Faltan las variables de entorno de Supabase en Netlify.' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const siteUrl = process.env.URL || 'https://pangloss.example';

  const { data: articles, error } = await supabase
    .from('articles')
    .select('title, slug, excerpt, published_at, author:authors(name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    return { statusCode: 500, body: 'No se pudo generar el feed.' };
  }

  const items = (articles ?? [])
    .map((a) => {
      const link = `${siteUrl}/articulo/${a.slug}`;
      const author = Array.isArray(a.author) ? a.author[0] : a.author;
      return `
    <item>
      <title>${escapeXml(a.title || 'Sin título')}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(a.published_at as string).toUTCString()}</pubDate>
      ${a.excerpt ? `<description>${escapeXml(a.excerpt)}</description>` : ''}
      ${author?.name ? `<dc:creator>${escapeXml(author.name)}</dc:creator>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Pangloss</title>
    <link>${siteUrl}</link>
    <description>Revista digital de análisis, ensayo e ideas.</description>
    <language>es</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    body: xml,
  };
};
