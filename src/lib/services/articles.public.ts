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
 * La portada es siempre el artículo publicado más reciente — nunca uno fijo
 * por más tiempo que lleve marcado como "destacado". Antes se priorizaba
 * `featured`, lo que dejaba anclado el mismo artículo en portada aunque se
 * publicaran otros más nuevos.
 */
export async function getFeaturedArticle(): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
    .order('published_at', orderByPublished())
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Article) ?? null;
}

export async function getLatestArticles(limit = 6, excludeId?: string): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
    .order('published_at', orderByPublished())
    .limit(limit);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getArticlesByCategorySlug(categorySlug: string, limit = 40): Promise<Article[]> {
  const { data: category } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
  const categoryId = (category as { id: string } | null)?.id;
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
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
  const { data, error } = await supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
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

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  if (!article.category_id) return [];
  const { data, error } = await supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
    .eq('category_id', article.category_id)
    .neq('id', article.id)
    .order('published_at', orderByPublished())
    .limit(limit);
  if (error) return [];
  return (data ?? []) as unknown as Article[];
}

export async function searchArticles(query: string): Promise<Article[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('articles')
    .select(SUMMARY_FIELDS)
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order('published_at', orderByPublished())
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getAllCategoriesArticleCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('articles').select('category_id').eq('status', 'published');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { category_id: string | null }).category_id;
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
