import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { visibleNowOrFilter } from './lib/visibility';

/**
 * Feed RSS generado en caliente (no un archivo estático) para que siempre
 * refleje los artículos publicados más recientes sin depender de un nuevo
 * build. Reutiliza las mismas variables de entorno que el cliente
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — deben estar configuradas
 * también como variables de entorno del sitio en Netlify, no solo en
 * .env.local.
 *
 * `published_at` es la fecha de publicación ORIGINAL (inmutable a partir de
 * la primera vez que se fija — ver migración
 * 20260817160000_freeze_published_at.sql), así que editar un artículo ya
 * publicado nunca lo hace parecer una entrada nueva aquí: mismo pubDate,
 * mismo guid, en el mismo sitio del listado.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface CategoryRef {
  name: string;
}

interface AuthorRef {
  name: string;
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
    .select('id, title, slug, excerpt, published_at, featured_image_url, author:authors(name), category:categories(name)')
    .or(visibleNowOrFilter())
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    return { statusCode: 500, body: 'No se pudo generar el feed.' };
  }

  const rows = articles ?? [];

  const items = rows
    .map((a) => {
      const link = `${siteUrl}/articulo/${a.slug}`;
      const author = (Array.isArray(a.author) ? a.author[0] : a.author) as AuthorRef | null;
      const category = (Array.isArray(a.category) ? a.category[0] : a.category) as CategoryRef | null;
      return `
    <item>
      <title>${escapeXml(a.title || 'Sin título')}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${a.id}</guid>
      <pubDate>${new Date(a.published_at as string).toUTCString()}</pubDate>
      ${a.excerpt ? `<description>${escapeXml(a.excerpt)}</description>` : ''}
      ${author?.name ? `<dc:creator>${escapeXml(author.name)}</dc:creator>` : ''}
      ${category?.name ? `<category>${escapeXml(category.name)}</category>` : ''}
      ${a.featured_image_url ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${escapeXml(a.featured_image_url)}" />` : ''}
    </item>`;
    })
    .join('');

  // Igual que en `Home`/`Articles` (orden por `published_at` desc): el
  // artículo más reciente de la lista ya ordenada marca el `lastBuildDate`
  // del canal — no hace falta una consulta aparte ni usar `now()`, que
  // cambiaría en cada request sin que el contenido lo haya hecho.
  const lastBuildDate = rows[0]?.published_at
    ? new Date(rows[0].published_at as string).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Pangloss</title>
    <link>${siteUrl}</link>
    <description>Revista digital de análisis, ensayo e ideas.</description>
    <language>es</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
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
