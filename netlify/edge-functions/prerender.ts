import type { Context } from 'https://edge.netlify.com';

/**
 * Meta tags (título, descripción, Open Graph, Twitter Card) servidas ya
 * puestas en el HTML — solo para bots/crawlers que NO ejecutan JavaScript
 * (Facebook, Twitter/X, LinkedIn, Slack, WhatsApp, Telegram, Discord…).
 * Un usuario real sigue recibiendo la SPA normal (`context.next()`),
 * donde `usePageMeta` (`src/lib/seo.ts`) ya actualiza el `<title>`/meta del
 * lado del cliente para la pestaña del navegador — esta función cubre
 * exactamente el hueco que ese comentario dejaba anotado: "para
 * compartidos en redes... está prevista la Netlify Function".
 *
 * Deliberadamente NO se intenta prerenderizar el artículo completo (eso sí
 * sería reconstruir SSR/SSG, descartado por decisión de arquitectura) —
 * solo las etiquetas <head> que los crawlers de redes sociales leen antes
 * de generar la tarjeta de enlace, más un cuerpo mínimo legible para
 * crawlers de buscadores que si acaso lean el HTML crudo.
 */
const BOT_UA_PATTERN =
  /facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|googlebot|bingbot|duckduckbot|pinterest|redditbot|applebot|yandex|semrushbot|ahrefsbot|embedly|quora link preview|vkshare|w3c_validator/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface MetaPage {
  title: string;
  description: string;
  image?: string | null;
  type?: string;
  extra?: string;
  jsonLd?: Record<string, unknown>;
}

function renderHtml(page: MetaPage, canonical: string): string {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const image = page.image ? escapeHtml(page.image) : null;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${title} — Pangloss</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="${page.type ?? 'website'}" />
<meta property="og:site_name" content="Pangloss" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
${image ? `<meta property="og:image" content="${image}" />` : ''}
<meta property="og:url" content="${canonical}" />
${page.extra ?? ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
${page.jsonLd ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>` : ''}
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
</body>
</html>`;
}

async function supabaseSelect(base: string, key: string, path: string): Promise<unknown[]> {
  const res = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) return [];
  return res.json();
}

export default async (request: Request, context: Context) => {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_PATTERN.test(ua)) return context.next();

  const url = new URL(request.url);
  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
  const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) return context.next();

  const articleMatch = url.pathname.match(/^\/articulo\/([^/]+)\/?$/);
  const categoryMatch = url.pathname.match(/^\/categoria\/([^/]+)\/?$/);
  const authorMatch = url.pathname.match(/^\/autor\/([^/]+)\/?$/);

  if (articleMatch) {
    const slug = articleMatch[1];
    const rows = (await supabaseSelect(
      supabaseUrl,
      supabaseKey,
      `articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,subtitle,excerpt,seo_title,seo_description,featured_image_url,published_at,updated_at,author:authors(name),category:categories(name)`,
    )) as Array<{
      title: string;
      subtitle: string | null;
      excerpt: string | null;
      seo_title: string | null;
      seo_description: string | null;
      featured_image_url: string | null;
      published_at: string | null;
      updated_at: string | null;
      author: { name: string } | { name: string }[] | null;
      category: { name: string } | { name: string }[] | null;
    }>;
    const article = rows[0];
    if (!article) return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

    const author = Array.isArray(article.author) ? article.author[0] : article.author;
    const category = Array.isArray(article.category) ? article.category[0] : article.category;
    const canonical = url.origin + url.pathname;
    const title = article.seo_title || article.title;
    const description = article.seo_description || article.excerpt || article.subtitle || 'Un artículo de Pangloss.';
    const html = renderHtml(
      {
        title,
        description,
        image: article.featured_image_url,
        type: 'article',
        extra: [
          article.published_at ? `<meta property="article:published_time" content="${article.published_at}" />` : '',
          author?.name ? `<meta property="article:author" content="${escapeHtml(author.name)}" />` : '',
          category?.name ? `<meta property="article:section" content="${escapeHtml(category.name)}" />` : '',
        ].join('\n'),
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description,
          image: article.featured_image_url || undefined,
          datePublished: article.published_at || undefined,
          dateModified: article.updated_at || article.published_at || undefined,
          author: author?.name ? { '@type': 'Person', name: author.name } : undefined,
          publisher: { '@type': 'Organization', name: 'Pangloss' },
          mainEntityOfPage: canonical,
        },
      },
      canonical,
    );
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (categoryMatch) {
    const slug = categoryMatch[1];
    const rows = (await supabaseSelect(supabaseUrl, supabaseKey, `categories?slug=eq.${encodeURIComponent(slug)}&select=name,description`)) as Array<{
      name: string;
      description: string | null;
    }>;
    const category = rows[0];
    if (!category) return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    const html = renderHtml(
      { title: category.name, description: category.description || `Artículos de Pangloss en la categoría ${category.name}.` },
      url.origin + url.pathname,
    );
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (authorMatch) {
    const slug = authorMatch[1];
    const rows = (await supabaseSelect(supabaseUrl, supabaseKey, `authors?slug=eq.${encodeURIComponent(slug)}&select=name,bio,photo_url`)) as Array<{
      name: string;
      bio: string | null;
      photo_url: string | null;
    }>;
    const author = rows[0];
    if (!author) return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    const html = renderHtml(
      { title: author.name, description: author.bio || `Artículos de ${author.name} en Pangloss.`, image: author.photo_url, type: 'profile' },
      url.origin + url.pathname,
    );
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  return context.next();
};

export const config = { path: ['/articulo/*', '/categoria/*', '/autor/*'] };
