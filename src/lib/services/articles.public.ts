import { supabase } from '@/lib/supabase';
import type { Article } from '@/types/database';

/**
 * Dos selects distintos a propósito: los listados no necesitan `content`
 * (puede ser un documento grande) y la vista de detalle sí, junto con la
 * bibliografía. Evita transferir jsonb de más en cada listado.
 */
const SUMMARY_FIELDS = `
  id, title, subtitle, slug, excerpt, featured_image_url, featured_image_alt, featured_image_caption,
  reading_time_minutes, published_at, featured,
  author:authors(id, name, slug, photo_url),
  category:categories(id, name, slug, color)
`;

const DETAIL_FIELDS = `
  *,
  author:authors(*),
  category:categories(*),
  references:article_references(*)
`;

function orderByPublished() {
  return { ascending: false } as const;
}

/**
 * Único punto de verdad para "¿este artículo es visible para un lector
 * ahora mismo?" del lado del cliente — el mismo criterio, palabra por
 * palabra, que la función `article_is_live()` que ya aplica RLS en la base
 * de datos (ver la migración de programación de publicación): publicado,
 * o programado cuya fecha ya ha llegado. RLS es la barrera de seguridad
 * real y nunca dejaría pasar nada antes de tiempo aunque este filtro
 * tuviera un error — pero sin él, cada consulta pública tendría que
 * repetir la misma condición `status.eq.published,and(...)` a mano.
 */
function visibleNow<T>(query: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).or(`status.eq.published,and(status.eq.scheduled,published_at.lte.${new Date().toISOString()})`);
}

/**
 * La portada es siempre el artículo publicado más reciente — nunca uno fijo
 * por más tiempo que lleve marcado como "destacado". Antes se priorizaba
 * `featured`, lo que dejaba anclado el mismo artículo en portada aunque se
 * publicaran otros más nuevos.
 */
export async function getFeaturedArticle(): Promise<Article | null> {
  const { data, error } = await visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
    .order('published_at', orderByPublished())
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Article) ?? null;
}

export async function getLatestArticles(limit = 6, excludeId?: string): Promise<Article[]> {
  let query = visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
    .order('published_at', orderByPublished())
    .limit(limit);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

/** Para el tope de 10 artículos en Home — cuenta el total de artículos
 * realmente visibles ahora mismo (sin traer sus datos, `head: true`),
 * para decidir si hace falta el enlace "Ver más artículos". */
export async function getVisibleArticlesCount(): Promise<number> {
  const { count, error } = await visibleNow(supabase.from('articles').select('id', { count: 'exact', head: true }));
  if (error) throw error;
  return count ?? 0;
}

export async function getArticlesByCategorySlug(categorySlug: string, limit = 40): Promise<Article[]> {
  const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
  const categoryId = (category as { id: string } | null)?.id;
  if (!categoryId) return [];
  const { data, error } = await visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
    .eq('category_id', categoryId)
    .order('published_at', orderByPublished())
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getArticlesByAuthorSlug(authorSlug: string): Promise<Article[]> {
  const { data: author } = await supabase.from('authors').select('id').eq('slug', authorSlug).maybeSingle();
  const authorId = (author as { id: string } | null)?.id;
  if (!authorId) return [];
  const { data, error } = await visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
    .eq('author_id', authorId)
    .order('published_at', orderByPublished());
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select(DETAIL_FIELDS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

/**
 * Los hasta 3 artículos relacionados que un editor ha elegido a mano para
 * este artículo (`article_related`, ordenados por `sort_order`) — nunca
 * más de 3 porque el propio editor no deja añadir un cuarto (ver
 * `RelatedArticlesPicker`). Los que ya no estén disponibles (despublicados,
 * borrados) simplemente no aparecen — RLS ya los excluye de raíz, así que
 * ni siquiera hace falta filtrarlos aquí a mano.
 */
export async function getRelatedArticles(article: Article): Promise<Article[]> {
  const { data, error } = await supabase
    .from('article_related')
    .select(`sort_order, related:articles!related_article_id(${SUMMARY_FIELDS})`)
    .eq('article_id', article.id)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? [])
    .map((row) => (row as unknown as { related: Article | null }).related)
    .filter((a): a is Article => a !== null);
}

/**
 * "Anterior" y "siguiente" en el mismo orden que usa el resto del sitio
 * (fecha de publicación, más reciente primero): "siguiente" es el que se
 * publicó justo después que este (más reciente), "anterior" el que se
 * publicó justo antes (más antiguo) — igual que hojear una revista hacia
 * adelante o hacia atrás en el tiempo. Solo entre artículos visibles ahora
 * mismo; ninguno de los dos aparece si no existe.
 */
export async function getAdjacentArticles(article: Article): Promise<{ previous: Article | null; next: Article | null }> {
  if (!article.published_at) return { previous: null, next: null };
  const [olderRes, newerRes] = await Promise.all([
    visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
      .lt('published_at', article.published_at)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
      .gt('published_at', article.published_at)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  return { previous: (olderRes.data as unknown as Article) ?? null, next: (newerRes.data as unknown as Article) ?? null };
}

export async function searchArticles(query: string): Promise<Article[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await visibleNow(supabase.from('articles').select(SUMMARY_FIELDS))
    .or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order('published_at', orderByPublished())
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getAllCategoriesArticleCounts(): Promise<Record<string, number>> {
  const { data, error } = await visibleNow(supabase.from('articles').select('category_id'));
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { category_id: string | null }).category_id;
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
