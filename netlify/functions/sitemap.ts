import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Sitemap generado en caliente (mismo patrón que `rss.ts`) — no un archivo
 * estático de build, así que nunca queda desfasado respecto a qué
 * artículos/categorías/autores existen de verdad.
 */
function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export const handler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: 'Faltan las variables de entorno de Supabase en Netlify.' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const siteUrl = process.env.URL || 'https://pangloss.example';

  const [articlesRes, categoriesRes, authorsRes] = await Promise.all([
    supabase.from('articles').select('slug, updated_at, published_at').eq('status', 'published').order('published_at', { ascending: false }),
    supabase.from('categories').select('slug'),
    supabase.from('authors').select('slug'),
  ]);

  if (articlesRes.error || categoriesRes.error || authorsRes.error) {
    return { statusCode: 500, body: 'No se pudo generar el sitemap.' };
  }

  const staticEntries: UrlEntry[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/articulos', changefreq: 'daily', priority: '0.8' },
    { loc: '/categorias', changefreq: 'weekly', priority: '0.5' },
    { loc: '/autores', changefreq: 'weekly', priority: '0.5' },
    { loc: '/sobre', changefreq: 'monthly', priority: '0.3' },
    { loc: '/colabora', changefreq: 'monthly', priority: '0.3' },
    { loc: '/suscribete', changefreq: 'monthly', priority: '0.3' },
  ];

  const articleEntries: UrlEntry[] = (articlesRes.data ?? []).map((a) => ({
    loc: `/articulo/${a.slug}`,
    lastmod: new Date((a.updated_at as string) || (a.published_at as string)).toISOString().slice(0, 10),
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const categoryEntries: UrlEntry[] = (categoriesRes.data ?? []).map((c) => ({
    loc: `/categoria/${c.slug}`,
    changefreq: 'weekly',
    priority: '0.5',
  }));

  const authorEntries: UrlEntry[] = (authorsRes.data ?? []).map((a) => ({
    loc: `/autor/${a.slug}`,
    changefreq: 'weekly',
    priority: '0.4',
  }));

  const allEntries = [...staticEntries, ...articleEntries, ...categoryEntries, ...authorEntries];

  const urls = allEntries
    .map(
      (e) => `
  <url>
    <loc>${xmlEscape(siteUrl + e.loc)}</loc>
    ${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}
    ${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ''}
    ${e.priority ? `<priority>${e.priority}</priority>` : ''}
  </url>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    body: xml,
  };
};
