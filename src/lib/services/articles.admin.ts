import { supabase } from '@/lib/supabase';
import type { Article, ArticleStatus } from '@/types/database';

const ADMIN_FIELDS = `
  id, title, subtitle, slug, status, featured, reading_time_minutes, reading_time_auto,
  published_at, created_at, updated_at, version, user_id, author_id, category_id,
  author:authors(id, name),
  category:categories(id, name)
`;

export async function getMyArticles(userId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const { data, error } = await supabase.from('articles').select(ADMIN_FIELDS).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getInReviewArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .eq('status', 'in_review')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function createDraftArticle(userId: string): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .insert({ user_id: userId, title: '', status: 'draft', content: {} })
    .select(ADMIN_FIELDS)
    .single();
  if (error) throw error;
  return data as unknown as Article;
}

/**
 * Cambia el estado editorial de un artículo. No usa `expected_version`
 * porque un cambio de estado (enviar a revisión, publicar, archivar) es una
 * acción explícita del usuario sobre la fila tal y como está en pantalla,
 * no una escritura de autoguardado en carrera con otras — la protección de
 * concurrencia de `version` es para el contenido del editor (Fase 6).
 */
/**
 * Devuelve la nueva `version` de la fila: este escritura pasa por el mismo
 * trigger que incrementa `version` en cada UPDATE, pero al hacerse fuera del
 * hook de autoguardado (deliberadamente, ver comentario más arriba), ese
 * hook no se entera por sí solo. Sin devolver la versión aquí para que la
 * llamante la sincronice, el siguiente autoguardado partiría de una versión
 * ya caducada y fallaría con un falso conflicto.
 *
 * No se toca `published_at` desde aquí: el trigger `articles_freeze_published_at`
 * (en la base de datos) es quien lo fija la primera vez que el estado pasa a
 * "published" y lo protege de cualquier reescritura después — incluida una
 * republicación tras despublicar. Es la fecha de publicación ORIGINAL, no la
 * de la última edición (esa es `updated_at`, gestionada aparte).
 */
export async function setArticleStatus(id: string, status: ArticleStatus): Promise<{ version: number }> {
  // Publicar (desde borrador, desde revisión, o forzar ya un artículo
  // programado antes de su fecha) manda siempre el momento real: para un
  // borrador sin fecha previa da igual, el trigger la habría puesto igual
  // — pero para uno YA programado con una fecha futura, sin esto
  // `published_at` se quedaría en esa fecha futura al publicarlo ahora
  // mismo a mano. Si el artículo ya estaba "published" de verdad, el
  // propio trigger ignora este valor y conserva el original — nunca lo
  // desplaza (ver `tg_articles_freeze_published_at`).
  const patch: { status: ArticleStatus; published_at?: string } = { status };
  if (status === 'published') patch.published_at = new Date().toISOString();
  const { data, error } = await supabase.from('articles').update(patch).eq('id', id).select('version').single();
  if (error) throw error;
  return data as { version: number };
}

/**
 * Programa (o reprograma) la publicación para una fecha/hora futura —
 * `status` y `published_at` en el mismo UPDATE, para que el trigger de la
 * base de datos (`tg_articles_freeze_published_at`) los vea juntos: como
 * el artículo no estaba ya "published", respeta la fecha que se le manda
 * aquí tal cual, sin tocarla. Reprogramar (el artículo ya estaba
 * "scheduled") es exactamente la misma llamada con una fecha distinta.
 */
export async function scheduleArticle(id: string, publishAt: Date): Promise<{ version: number }> {
  const { data, error } = await supabase
    .from('articles')
    .update({ status: 'scheduled' satisfies ArticleStatus, published_at: publishAt.toISOString() })
    .eq('id', id)
    .select('version')
    .single();
  if (error) throw error;
  return data as { version: number };
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) throw error;
}

export async function updateArticleMeta(
  id: string,
  patch: Partial<Pick<Article, 'title' | 'subtitle' | 'slug' | 'excerpt' | 'category_id' | 'author_id' | 'featured' | 'seo_title' | 'seo_description'>>,
): Promise<void> {
  const { error } = await supabase.from('articles').update(patch).eq('id', id);
  if (error) throw error;
}

export async function getArticleByIdAdmin(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('*, author:authors(*), category:categories(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

/**
 * Candidatas para el selector de "artículos relacionados" en el editor:
 * cualquier OTRO artículo publicado o programado — el propio editor ya
 * conoce el estado de sus artículos, no tiene sentido esconderle un
 * borrador ajeno por no estar publicado todavía si va a estarlo pronto;
 * lo que sí filtra `getRelatedArticles` (lado público) es que solo se
 * muestre al lector si de verdad está disponible cuando él lo visite.
 */
export async function getRelatedCandidates(excludeId?: string): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select('id, title, category_id, status, category:categories(name)')
    .in('status', ['published', 'scheduled'])
    .order('published_at', { ascending: false });
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

/** Los hasta 3 artículos relacionados ya elegidos para este artículo, en
 * orden — usado para precargar el selector del editor. */
export async function getRelatedArticleIds(articleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('article_related')
    .select('related_article_id')
    .eq('article_id', articleId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => (r as { related_article_id: string }).related_article_id);
}

/** Sustituye el conjunto entero por `relatedIds` (máximo 3, ya validado en
 * el propio selector) — borrar-y-reinsertar es más simple y a la vez más
 * robusto que calcular un diff, y esta tabla nunca tiene más de 3 filas
 * por artículo, así que el coste es irrelevante. */
export async function setRelatedArticles(articleId: string, relatedIds: string[]): Promise<void> {
  const { error: delError } = await supabase.from('article_related').delete().eq('article_id', articleId);
  if (delError) throw delError;
  if (relatedIds.length === 0) return;
  const rows = relatedIds.slice(0, 3).map((related_article_id, sort_order) => ({ article_id: articleId, related_article_id, sort_order }));
  const { error: insError } = await supabase.from('article_related').insert(rows);
  if (insError) throw insError;
}

export interface DashboardCounts {
  draft: number;
  in_review: number;
  scheduled: number;
  published: number;
  archived: number;
  authors: number;
  users: number;
  categories: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [articles, authors, users, categories] = await Promise.all([
    supabase.from('articles').select('status'),
    supabase.from('authors').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
  ]);
  if (articles.error) throw articles.error;

  const counts: DashboardCounts = {
    draft: 0,
    in_review: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
    authors: authors.count ?? 0,
    users: users.count ?? 0,
    categories: categories.count ?? 0,
  };
  for (const row of articles.data ?? []) {
    const status = (row as { status: ArticleStatus }).status;
    if (status in counts) counts[status as ArticleStatus] += 1;
  }
  return counts;
}

export async function getRecentActivity(limit = 6): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}
