/**
 * Punto de verdad único, para las Netlify Functions (RSS, sitemap), de qué
 * cuenta como "visible para un lector ahora mismo" — el mismo criterio que
 * `visibleNow()` en `src/lib/services/articles.public.ts` y que
 * `article_is_live()` en la base de datos (ver la migración de
 * programación de publicación): publicado, o programado cuya fecha ya ha
 * llegado. Sin esto, un artículo programado para el futuro aparecería en
 * el feed RSS o en el sitemap antes de tiempo — RLS no lo impediría aquí
 * porque estas funciones usan la clave anon igual que el propio sitio
 * público, así que el filtro tiene que ponerlo cada consulta, igual que ya
 * hace `articles.public.ts`.
 */
export function visibleNowOrFilter(): string {
  return `status.eq.published,and(status.eq.scheduled,published_at.lte.${new Date().toISOString()})`;
}
