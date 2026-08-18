import type { Handler } from '@netlify/functions';

/**
 * `robots.txt` generado en caliente para poder referenciar el sitemap con
 * el dominio real de cada despliegue (`process.env.URL`, la misma variable
 * que ya usan `rss.ts` y `sitemap.ts`) — un archivo estático en `public/`
 * no puede saber ese dominio en build time sin quedar hardcodeado y, con
 * un dominio propio distinto al de Netlify, desincronizado.
 */
export const handler: Handler = async () => {
  const siteUrl = process.env.URL || 'https://pangloss.example';

  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /confirmar-suscripcion
Disallow: /darse-de-baja

Sitemap: ${siteUrl}/sitemap.xml
`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body,
  };
};
